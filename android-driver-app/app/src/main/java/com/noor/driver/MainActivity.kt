package com.noor.driver

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.noor.driver.location.DriverLocationService

class MainActivity : AppCompatActivity() {

  private lateinit var driverField: EditText
  private lateinit var tenantField: EditText
  private lateinit var tokenField: EditText
  private lateinit var statusText: TextView

  private val permissionLauncher = registerForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { result ->
    val granted = result.values.all { it }
    if (granted) {
      startTracking()
    } else {
      statusText.text = "الرجاء منح صلاحيات الموقع والإشعارات"
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_main)
    driverField = findViewById(R.id.inputDriver)
    tenantField = findViewById(R.id.inputTenant)
    tokenField = findViewById(R.id.inputToken)
    statusText = findViewById(R.id.txtStatus)
    findViewById<Button>(R.id.btnStart).setOnClickListener {
      if (hasAllPermissions()) {
        startTracking()
      } else {
        requestPermissions()
      }
    }
    findViewById<Button>(R.id.btnStop).setOnClickListener {
      stopService(Intent(this, DriverLocationService::class.java))
      statusText.text = "تم إيقاف الخدمة"
    }
  }

  private fun startTracking() {
    val driverId = driverField.text.toString().trim()
    val tenantId = tenantField.text.toString().trim()
    val token = tokenField.text.toString().trim()
    if (driverId.isEmpty() || tenantId.isEmpty() || token.isEmpty()) {
      statusText.text = "أدخل معرف السائق والمستأجر والرمز"
      return
    }
    val intent = Intent(this, DriverLocationService::class.java).apply {
      putExtra(DriverLocationService.EXTRA_DRIVER_ID, driverId)
      putExtra(DriverLocationService.EXTRA_TENANT_ID, tenantId)
      putExtra(DriverLocationService.EXTRA_TOKEN, token)
    }
    ContextCompat.startForegroundService(this, intent)
    statusText.text = "يتم إرسال الموقع كل 10 ثوانٍ"
  }

  private fun hasAllPermissions(): Boolean {
    val required = mutableListOf(
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION
    )
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      required.add(Manifest.permission.POST_NOTIFICATIONS)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      required.add(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    }
    return required.all { ContextCompat.checkSelfPermission(this, it) == PackageManager.PERMISSION_GRANTED }
  }

  private fun requestPermissions() {
    val required = mutableListOf(
      Manifest.permission.ACCESS_FINE_LOCATION,
      Manifest.permission.ACCESS_COARSE_LOCATION
    )
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
      required.add(Manifest.permission.POST_NOTIFICATIONS)
    }
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      required.add(Manifest.permission.ACCESS_BACKGROUND_LOCATION)
    }
    permissionLauncher.launch(required.toTypedArray())
  }
}
