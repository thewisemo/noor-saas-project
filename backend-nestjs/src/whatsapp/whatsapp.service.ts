import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Tenant } from '../database/entities/tenant.entity';
import { Customer } from '../database/entities/customer.entity';
import { Conversation, ConversationStatus } from '../database/entities/conversation.entity';
import { Zone } from '../database/entities/zone.entity';
import { pointInPolygon } from '../utils/geo';
import { Promotion } from '../database/entities/promotion.entity';
import { Product } from '../database/entities/product.entity';
import { AiService } from '../ai/ai.service';
import { ConversationsGateway } from '../sockets/conversations.gateway';

interface WhatsAppMessage {
  from: string;
  id: string;
  type: string;
  timestamp: string;
  text?: { body: string };
  location?: { latitude: string; longitude: string };
  interactive?: {
    list_reply?: { id: string; title: string };
    button_reply?: { id: string; title: string };
  };
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly graphVersion = 'v18.0';

  constructor(
    private readonly config: ConfigService,
    private readonly ai: AiService,
    @InjectRepository(Tenant) private readonly tenantsRepo: Repository<Tenant>,
    @InjectRepository(Customer) private readonly customersRepo: Repository<Customer>,
    @InjectRepository(Conversation) private readonly conversationsRepo: Repository<Conversation>,
    @InjectRepository(Zone) private readonly zonesRepo: Repository<Zone>,
    @InjectRepository(Promotion) private readonly promotionsRepo: Repository<Promotion>,
    @InjectRepository(Product) private readonly productsRepo: Repository<Product>,
    private readonly conversationsGateway: ConversationsGateway,
  ) {}

  async handleWebhook(body: any) {
    const entries = body?.entry ?? [];
    for (const entry of entries) {
      const changes = entry?.changes ?? [];
      for (const change of changes) {
        const value = change?.value;
        const phoneId = value?.metadata?.phone_number_id;
        const messages: WhatsAppMessage[] = value?.messages ?? [];
        for (const message of messages) {
          await this.processMessage(phoneId, message, value?.contacts?.[0]);
        }
      }
    }
  }

  private async processMessage(phoneNumberId: string, message: WhatsAppMessage, contact?: any) {
    if (!phoneNumberId || !message) return;
    const tenant = await this.tenantsRepo.findOne({ where: { whatsappPhoneNumberId: phoneNumberId } });
    if (!tenant) {
      this.logger.warn(`No tenant mapped for phone ${phoneNumberId}`);
      return;
    }

    const customer = await this.ensureCustomer(tenant, message.from, contact);
    const conversation = await this.ensureConversation(tenant.id, customer.id);

    await this.appendConversationMessage(conversation, {
      id: message.id,
      from: 'customer',
      content: message.text?.body || message.type,
      created_at: new Date(Number(message.timestamp) * 1000).toISOString(),
      metadata: message,
    });

    if (message.location) {
      await this.handleLocationMessage(tenant.id, customer.phone, phoneNumberId, message);
      return;
    }

    if (message.interactive) {
      await this.handleInteractiveReply(tenant.id, customer.phone, phoneNumberId, message);
      return;
    }

    if (message.text?.body) {
      await this.handleTextMessage(tenant.id, customer.phone, phoneNumberId, message.text.body);
    }
  }

  private async ensureCustomer(tenant: Tenant, phone: string, contact?: any) {
    let customer = await this.customersRepo.findOne({ where: { tenant_id: tenant.id, phone } });
    if (!customer) {
      customer = this.customersRepo.create({
        tenant_id: tenant.id,
        name: contact?.profile?.name || `عميل ${phone}`,
        phone,
        whatsapp_number: phone,
      });
      await this.customersRepo.save(customer);
    }
    return customer;
  }

  private async ensureConversation(tenantId: string, customerId: string) {
    let conversation = await this.conversationsRepo.findOne({
      where: { tenant_id: tenantId, customer_id: customerId, status: ConversationStatus.AI_ACTIVE },
    });
    if (!conversation) {
      conversation = this.conversationsRepo.create({
        tenant_id: tenantId,
        customer_id: customerId,
        status: ConversationStatus.AI_ACTIVE,
        messages: [],
      });
    }
    return this.conversationsRepo.save(conversation);
  }

  private async appendConversationMessage(conversation: Conversation, message: Conversation['messages'][0]) {
    conversation.messages = [...(conversation.messages || []), message];
    conversation.last_message_at = new Date();
    const saved = await this.conversationsRepo.save(conversation);
    this.conversationsGateway.emitConversationUpdate(conversation.tenant_id, {
      conversationId: saved.id,
      status: saved.status,
      lastMessage: message,
    });
  }

  private async handleLocationMessage(tenantId: string, to: string, phoneNumberId: string, message: WhatsAppMessage) {
    const lat = Number(message.location?.latitude);
    const lng = Number(message.location?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }
    const zones = await this.zonesRepo.find({ where: { tenant_id: tenantId } });
    const zone = zones.find(z => z.polygon?.coordinates && pointInPolygon([lng, lat], z.polygon.coordinates));
    if (!zone) {
      await this.sendTextMessage(phoneNumberId, to, 'عذرًا، موقعك خارج نطاق التغطية الحالي.');
      return;
    }
    const fee = Number(zone.delivery_fee).toFixed(2);
    const min = Number(zone.minimum_order_value).toFixed(2);
    await this.sendTextMessage(
      phoneNumberId,
      to,
      `تم التعرف على منطقتك: ${zone.name}.\nرسوم التوصيل: ${fee} ر.س.\nالحد الأدنى للطلب: ${min} ر.س.`,
    );
  }

  private async handleTextMessage(tenantId: string, to: string, phoneNumberId: string, body: string) {
    const classification = await this.ai.classifyMessage(body, [
      'ASK_DELIVERY_FEE',
      'PROMOTION_QUERY',
      'OOS_ALTERNATIVES',
      'SMALL_TALK',
    ]);
    switch (classification.intent) {
      case 'PROMOTION_QUERY':
        if (classification.promotionCode) {
          await this.handlePromotion(tenantId, to, phoneNumberId, classification.promotionCode);
        } else {
          await this.sendTextMessage(phoneNumberId, to, 'أرسل رمز الكوبون للتأكد من صلاحيته.');
        }
        break;
      case 'OOS_ALTERNATIVES':
        await this.sendAlternatives(tenantId, to, phoneNumberId, classification.product || body);
        break;
      default:
        await this.sendTextMessage(
          phoneNumberId,
          to,
          'مرحبًا! أرسل موقعك المباشر لحساب رسوم التوصيل أو اكتب رمز العرض للتأكد من صلاحيته.',
        );
    }
  }

  private async handlePromotion(tenantId: string, to: string, phoneNumberId: string, code: string) {
    const normalized = code?.trim().toUpperCase();
    if (!normalized) {
      await this.sendTextMessage(phoneNumberId, to, 'أدخل رمزًا صالحًا للتحقق منه.');
      return;
    }
    const promotion = await this.promotionsRepo.findOne({
      where: { tenant_id: tenantId, code: normalized, is_active: true },
    });
    if (!promotion) {
      await this.sendTextMessage(phoneNumberId, to, 'عذرًا، لم يتم العثور على هذا الكوبون أو أنه منتهي.');
      return;
    }
    await this.sendTextMessage(
      phoneNumberId,
      to,
      `الكوبون صالح!\nنوع الخصم: ${promotion.discount_type}\nقيمة الخصم: ${promotion.discount_value}`,
    );
  }

  private async handleInteractiveReply(tenantId: string, to: string, phoneNumberId: string, message: WhatsAppMessage) {
    const replyId = message.interactive?.list_reply?.id || message.interactive?.button_reply?.id;
    if (!replyId) return;
    if (replyId === 'cancel_item') {
      await this.sendTextMessage(phoneNumberId, to, 'تم إلغاء الصنف المطلوب. هل تحتاج لأي مساعدة أخرى؟');
      return;
    }
    await this.sendTextMessage(phoneNumberId, to, `تم اختيار البديل: ${replyId}. سنقوم بتحديث الطلب فورًا.`);
  }

  private async sendAlternatives(tenantId: string, to: string, phoneNumberId: string, query: string) {
    const products = await this.productsRepo.find({
      where: { tenant_id: tenantId, is_active: true, is_available: true },
      take: 20,
    });
    const matches = products
      .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .map((p, idx) => ({
        id: `alt_${idx + 1}_${p.id}`,
        title: p.name,
        description: `${Number(p.price).toFixed(2)} ${p.currency}`,
      }));

    if (matches.length === 0) {
      await this.sendTextMessage(phoneNumberId, to, 'عذرًا، لا توجد بدائل متاحة حاليًا لهذا المنتج.');
      return;
    }

    matches.push({ id: 'cancel_item', title: 'لا أرغب، قم بإلغاء الصنف', description: '' });

    await this.sendInteractiveList(phoneNumberId, to, matches);
  }

  private async sendTextMessage(phoneNumberId: string, to: string, body: string) {
    await this.sendMetaRequest(phoneNumberId, {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body },
    });
  }

  private async sendInteractiveList(
    phoneNumberId: string,
    to: string,
    rows: Array<{ id: string; title: string; description?: string }>,
  ) {
    await this.sendMetaRequest(phoneNumberId, {
      messaging_product: 'whatsapp',
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        header: { type: 'text', text: 'بدائل متاحة' },
        body: { text: 'اختر البديل المناسب أو ألغِ الصنف' },
        action: {
          button: 'عرض البدائل',
          sections: [
            {
              title: 'اقتراحاتنا',
              rows: rows.map(row => ({
                id: row.id,
                title: row.title,
                description: row.description || '',
              })),
            },
          ],
        },
      },
    });
  }

  private async sendMetaRequest(phoneNumberId: string, payload: any) {
    const token = this.config.get<string>('WHATSAPP_ACCESS_TOKEN');
    if (!token) {
      this.logger.warn('WHATSAPP_ACCESS_TOKEN not configured');
      return;
    }
    try {
      await axios.post(
        `https://graph.facebook.com/${this.graphVersion}/${phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        },
      );
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message', error as Error);
    }
  }
}
