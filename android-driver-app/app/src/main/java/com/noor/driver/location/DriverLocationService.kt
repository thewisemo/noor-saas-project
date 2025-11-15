package com.noor.driver.location

import android.Manifest
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.location.Location
import android.os.Build
import android.os.IBinder
import androidx.core.app.ActivityCompat
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationResult
import com.google.android.gms.location.LocationServices
import com.noor.driver.BuildConfig
import com.noor.driver.MainActivity
import com.noor.driver.R
import io.socket.client.IO
import io.socket.client.Socket
import org.json.JSONObject

class DriverLocationService : Service() {

  private val fusedClient by lazy { LocationServices.getFusedLocationProviderClient(this) }
  private var socket: Socket? = null
  private var driverId: String = ""
  private var tenantId: String = ""
  private var authToken: String = ""

  private val locationCallback = object : LocationCallback() {
    override fun onLocationResult(result: LocationResult) {
      result.lastLocation?.let { emitLocation(it) }
    }
  }

  override fun onCreate() {
    super.onCreate()
    startForeground(NOTIFICATION_ID, buildNotification("متصل بالخدمة"))
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    driverId = intent?.getStringExtra(EXTRA_DRIVER_ID).orEmpty()
    tenantId = intent?.getStringExtra(EXTRA_TENANT_ID).orEmpty()
    authToken = intent?.getStringExtra(EXTRA_TOKEN).orEmpty()
    connectSocket()
    requestLocationUpdates()
    return START_STICKY
  }

  override fun onDestroy() {
    fusedClient.removeLocationUpdates(locationCallback)
    socket?.disconnect()
    socket = null
    super.onDestroy()
  }

  override fun onBind(intent: Intent?): IBinder? = null

  private fun requestLocationUpdates() {
    val fineGranted = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
    if (!fineGranted) {
      stopSelf()
      return
    }
    val request = LocationRequest.Builder(10000)
      .setMinUpdateIntervalMillis(5000)
      .setPriority(LocationRequest.PRIORITY_HIGH_ACCURACY)
      .build()
    fusedClient.requestLocationUpdates(request, locationCallback, mainLooper)
  }

  private fun connectSocket() {
    if (socket != null || authToken.isBlank()) return
    val options = IO.Options().apply {
      reconnection = true
      forceNew = true
      auth = mapOf("token" to authToken)
    }
    socket = IO.socket("${BuildConfig.SOCKET_URL}/location", options)
    socket?.connect()
  }

  private fun emitLocation(location: Location) {
    if (driverId.isBlank() || tenantId.isBlank()) return
    val payload = JSONObject().apply {
      put("driverId", driverId)
      put("tenantId", tenantId)
      put("lat", location.latitude)
      put("lng", location.longitude)
    }
    socket?.emit("driver_location_update", payload)
  }

  private fun buildNotification(content: String): Notification {
    val channelId = "driver_location_channel"
    val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val channel = NotificationChannel(channelId, "تتبع السائق", NotificationManager.IMPORTANCE_LOW)
      manager.createNotificationChannel(channel)
    }
    val pendingIntent = PendingIntent.getActivity(
      this,
      0,
      Intent(this, MainActivity::class.java),
      PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
    )
    return NotificationCompat.Builder(this, channelId)
      .setContentTitle("متابعة موقع السائق")
      .setContentText(content)
      .setSmallIcon(R.drawable.ic_launcher_foreground)
      .setContentIntent(pendingIntent)
      .setOngoing(true)
      .build()
  }

  companion object {
    const val EXTRA_DRIVER_ID = "driver_id"
    const val EXTRA_TENANT_ID = "tenant_id"
    const val EXTRA_TOKEN = "auth_token"
    private const val NOTIFICATION_ID = 1001
  }
}

