import time
import machine
import dht
import network
import urequests
import json
from machine import Pin, ADC

# Konfigurasi pin
DHT_PIN = 13  
MQ_ANALOG_PIN = 14  
MQ_DIGITAL_PIN = 12  
TRIG_PIN = 26  
ECHO_PIN = 27  

# Inisialisasi sensor
dht_sensor = dht.DHT22(Pin(DHT_PIN))
mq_analog = ADC(Pin(MQ_ANALOG_PIN))
mq_analog.atten(ADC.ATTN_11DB)  # Konfigurasi penguatan untuk pembacaan penuh 0-3.3V
mq_digital = Pin(MQ_DIGITAL_PIN, Pin.IN)
trigger = Pin(TRIG_PIN, Pin.OUT)
echo = Pin(ECHO_PIN, Pin.IN)

# Konfigurasi WiFi
WIFI_SSID = "YourWiFiSSID"
WIFI_PASSWORD = "YourWiFiPassword"
API_URL = "http://your-server-ip:5000/sensors"  # Ganti dengan URL server Anda

def connect_wifi():
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    if not wlan.isconnected():
        print('Menghubungkan ke WiFi...')
        wlan.connect(WIFI_SSID, WIFI_PASSWORD)
        
        # Tunggu hingga terhubung atau gagal
        max_wait = 10
        while max_wait > 0:
            if wlan.isconnected():
                break
            max_wait -= 1
            print('Menunggu koneksi...')
            time.sleep(1)
        
    if wlan.isconnected():
        print('Terhubung ke WiFi')
        print(f'IP: {wlan.ifconfig()[0]}')
        return True
    else:
        print('Koneksi WiFi gagal!')
        return False

def read_dht():
    try:
        dht_sensor.measure()
        temperature = dht_sensor.temperature()
        humidity = dht_sensor.humidity()
        return temperature, humidity
    except Exception as e:
        print("Error membaca DHT:", e)
        return None, None

def read_mq():
    try:
        # Baca nilai analog (0-4095) dan konversi ke ppm (ini perlu dikalibrasi)
        analog_value = mq_analog.read()
        
        # Konversi ke ppm CO2 (formula ini contoh, perlu disesuaikan dengan sensor yang digunakan)
        # Gunakan fungsi kalibrasi dari datasheet sensor MQ Anda
        gas_ppm = convert_to_ppm(analog_value)
        
        # Baca nilai digital (alarm)
        is_gas_detected = not mq_digital.value()  # LOW saat gas terdeteksi
        
        return gas_ppm, is_gas_detected
    except Exception as e:
        print("Error membaca MQ:", e)
        return None, None

def convert_to_ppm(analog_value):
    # Contoh konversi sederhana (perlu dikalibrasi dengan sensor sebenarnya)
    # Asumsi 0-4095 dipetakan ke 0-1000 ppm
    return int(analog_value / 4095 * 1000)

def read_distance():
    try:
        # Kirim pulsa 10us
        trigger.value(0)
        time.sleep_us(2)
        trigger.value(1)
        time.sleep_us(10)
        trigger.value(0)
        
        # Hitung durasi pulsa
        while echo.value() == 0:
            pulse_start = time.ticks_us()
        
        while echo.value() == 1:
            pulse_end = time.ticks_us()
        
        pulse_duration = time.ticks_diff(pulse_end, pulse_start)
        
        # Hitung jarak dalam cm (kecepatan suara = 34300 cm/s)
        distance = (pulse_duration * 0.0343) / 2
        
        return distance
    except Exception as e:
        print("Error membaca sensor ultrasonic:", e)
        return None

def send_data(temperature, humidity, gas_ppm, distance):
    if not all([temperature, humidity, gas_ppm, distance]):
        print("Ada data sensor yang tidak valid, tidak mengirim")
        return False
    
    data = {
        "temperature": temperature,
        "humidity": humidity,
        "gas": gas_ppm,
        "distance": distance,
        "timestamp": time.time()
    }
    
    try:
        response = urequests.post(
            API_URL,
            headers={'Content-Type': 'application/json'},
            data=json.dumps(data)
        )
        
        if response.status_code == 200:
            print("Data berhasil dikirim!")
            response.close()
            return True
        else:
            print(f"Gagal mengirim data: {response.status_code}")
            response.close()
            return False
    except Exception as e:
        print(f"Error saat mengirim data: {e}")
        return False

def main():
    # Hubungkan ke WiFi
    if not connect_wifi():
        return
    
    while True:
        # Baca sensor
        temperature, humidity = read_dht()
        gas_ppm, is_gas_detected = read_mq()
        distance = read_distance()
        
        # Tampilkan data
        print("-" * 40)
        print(f"Suhu: {temperature} °C")
        print(f"Kelembaban: {humidity} %")
        print(f"Gas: {gas_ppm} ppm {'(TERDETEKSI)' if is_gas_detected else ''}")
        print(f"Jarak: {distance} cm")
        
        # Kirim data ke server
        send_data(temperature, humidity, gas_ppm, distance)
        
        # Tunggu 5 detik sebelum pembacaan berikutnya
        time.sleep(5)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("Program dihentikan")
    except Exception as e:
        print(f"Error tidak terduga: {e}")
        machine.reset()  # Reset jika terjadi error fatal 