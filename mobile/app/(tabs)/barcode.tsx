import { useEffect, useState } from 'react';
import { Camera, CameraView } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function BarcodeScreen() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scannedCode, setScannedCode] = useState('');
  const [product, setProduct] = useState<{ name: string; brand?: string; code: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setHasPermission(false);
      return;
    }

    const requestPermission = async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    };

    requestPermission();
  }, []);



  const lookupProduct = async () => {
    if (!scannedCode.trim()) {
      setError('Please scan a barcode or try again.');
      return;
    }

    setLoading(true);
    setError('');
    setProduct(null);

    try {
      const response = await fetch(`https://world.openfoodfacts.org/api/v0/product/${scannedCode.trim()}.json`);
      const result = await response.json();

      if (result.status === 1 && result.product) {
        setProduct({
          name: result.product.product_name || result.product.generic_name || 'Unknown product',
          brand: result.product.brands,
          code: scannedCode,
        });
        setIsScanning(false);
      } else {
        setError('Product not found. Try scanning another barcode.');
        setIsScanning(true);
      }
    } catch (err) {
      setError('Could not lookup barcode. Check connection and try again.');
      console.error(err);
      setIsScanning(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = (result: any) => {
    if (!isScanning) return;
    
    const detectedCode = result.data;
    console.log('Barcode scanned:', detectedCode);
    setScannedCode(detectedCode);
    setIsScanning(false);
    // Auto-lookup after detection
    setTimeout(() => {
      lookupProduct();
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Scan UPC</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={styles.closeText}>Back</Text>
        </TouchableOpacity>
      </View>

      {Platform.OS === 'web' ? (
        <View style={styles.webContainer}>
          <Text style={styles.webText}>
            Camera is only supported on a native Expo Go device.
          </Text>
        </View>
      ) : hasPermission === null ? (
        <Text style={styles.message}>Requesting camera permission…</Text>
      ) : hasPermission === false ? (
        <Text style={styles.message}>
          Camera access denied. Enable camera permission in Expo Go.
        </Text>
      ) : (
        <>
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing={'back'}
              onBarcodeScanned={isScanning ? handleBarcodeScanned : undefined}
              barcodeScannerSettings={{
                barcodeTypes: ['upc_a', 'upc_e', 'ean8', 'ean13'],
              }}
            />
            <View style={styles.barcodeGuide}>
              <View style={styles.guideBorder} />
              <Text style={styles.guideText}>Position barcode in frame</Text>
            </View>
          </View>

          {scannedCode && (
            <View style={styles.scannedInfo}>
              <Text style={styles.scannedLabel}>Detected Code:</Text>
              <Text style={styles.scannedCode}>{scannedCode}</Text>
              <TouchableOpacity 
                style={styles.rescanButton}
                onPress={() => {
                  setScannedCode('');
                  setProduct(null);
                  setError('');
                  setIsScanning(true);
                }}
              >
                <Text style={styles.rescanText}>Scan Another</Text>
              </TouchableOpacity>
            </View>
          )}

          {loading ? (
            <View style={styles.resultCard}>
              <ActivityIndicator size="large" color="#5a7559" />
              <Text style={styles.loadingText}>Searching for product...</Text>
            </View>
          ) : error ? (
            <View style={styles.resultCard}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : product ? (
            <View style={styles.resultCard}>
              <Text style={styles.productName}>{product.name}</Text>
              {product.brand ? <Text style={styles.productBrand}>{product.brand}</Text> : null}
              <Text style={styles.productCode}>UPC: {product.code}</Text>
            </View>
          ) : (
            <View style={styles.instructionCard}>
              <Text style={styles.instructionText}>📱 Position a UPC barcode in the frame</Text>
              <Text style={styles.instructionText}>✓ Barcode will be detected automatically</Text>
            </View>
          )}
        </>
      )}

      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 8,
  },
  closeText: {
    fontSize: 16,
    color: '#007aff',
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
  },
  message: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  cameraContainer: {
    flex: 2,
    position: 'relative',
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: '100%',
    height: '100%',
  },
  barcodeGuide: {
    position: 'absolute',
    width: '80%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBorder: {
    width: '100%',
    height: 120,
    borderWidth: 3,
    borderColor: 'rgba(90, 117, 89, 0.8)',
    borderRadius: 10,
    borderStyle: 'dashed',
  },
  guideText: {
    position: 'absolute',
    bottom: -30,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  inputSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 15,
    justifyContent: 'flex-start',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  scannedInfo: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#5a7559',
  },
  scannedLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  scannedCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  rescanButton: {
    backgroundColor: '#5a7559',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  rescanText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionCard: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    fontSize: 16,
    color: '#5a7559',
    textAlign: 'center',
    marginVertical: 8,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  lookupButton: {
    backgroundColor: '#5a7559',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  lookupText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#5a7559',
    textAlign: 'center',
  },
  resultCard: {
    padding: 20,
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  productBrand: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  productCode: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  productHint: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});


