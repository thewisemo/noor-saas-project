package com.noor.preparer

import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.LinearLayout
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.google.zxing.integration.android.IntentIntegrator
import com.google.zxing.integration.android.IntentResult
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import org.json.JSONObject

class MainActivity : AppCompatActivity() {

  private val client = OkHttpClient()
  private lateinit var tokenField: EditText
  private lateinit var barcodeText: TextView
  private lateinit var resultContainer: LinearLayout
  private lateinit var statusText: TextView

  private val scanLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
    val intentResult: IntentResult? = IntentIntegrator.parseActivityResult(result.resultCode, result.data)
    val contents = intentResult?.contents
    if (!contents.isNullOrBlank()) {
      barcodeText.text = contents
      fetchAlternatives(contents)
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)
    tokenField = findViewById(R.id.inputToken)
    barcodeText = findViewById(R.id.txtBarcode)
    resultContainer = findViewById(R.id.listAlternatives)
    statusText = findViewById(R.id.txtStatus)
    findViewById<Button>(R.id.btnScan).setOnClickListener { launchScanner() }
    findViewById<Button>(R.id.btnRefresh).setOnClickListener {
      val code = barcodeText.text.toString()
      if (code.isNotBlank()) fetchAlternatives(code)
    }
  }

  private fun launchScanner() {
    val integrator = IntentIntegrator(this)
    integrator.setDesiredBarcodeFormats(IntentIntegrator.ONE_D_CODE_TYPES)
    integrator.setPrompt("وجّه الكاميرا إلى الباركود")
    integrator.setBeepEnabled(false)
    integrator.captureActivity = CaptureActivityPortrait::class.java
    scanLauncher.launch(integrator.createScanIntent())
  }

  private fun fetchAlternatives(barcode: String) {
    val token = tokenField.text.toString().trim()
    if (token.isEmpty()) {
      statusText.text = "أدخل رمز الدخول"
      return
    }
    statusText.text = "جارٍ جلب البدائل..."
    lifecycleScope.launch(Dispatchers.IO) {
      val request = Request.Builder()
        .url("${BuildConfig.API_URL}/products/alternatives/$barcode")
        .header("Authorization", "Bearer $token")
        .build()
      try {
        client.newCall(request).execute().use { response ->
          val body = response.body?.string().orEmpty()
          val json = JSONObject(body)
          val alternatives = json.optJSONArray("alternatives")
          runOnUiThread {
            resultContainer.removeAllViews()
            if (response.isSuccessful && alternatives != null && alternatives.length() > 0) {
              for (i in 0 until alternatives.length()) {
                val item = alternatives.getJSONObject(i)
                val view = layoutInflater.inflate(R.layout.item_alternative, resultContainer, false)
                view.findViewById<TextView>(R.id.altName).text = item.optString("name")
                view.findViewById<TextView>(R.id.altPrice).text = "${item.optString("price")} ${item.optString("currency")}"
                resultContainer.addView(view)
              }
              statusText.text = "تم عرض البدائل"
            } else {
              statusText.text = "لا توجد بدائل متاحة"
            }
          }
        }
      } catch (ex: Exception) {
        runOnUiThread {
          statusText.text = "خطأ في الاتصال"
        }
      }
    }
  }
}
