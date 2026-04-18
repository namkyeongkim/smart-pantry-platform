import { useEffect, useState } from 'react';
import { Camera, CameraView } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import { Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';

export default function BarcodeScanner({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedCode, setScannedCode] = useState('');
  const [product, setProduct] = useState(null);
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

  const handleBarcodeScanned = (result) => {
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
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
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
          ) : null}
        </>
      )}
      <StatusBar style="light" />
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#5a7559',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    color: '#fff',
    fontSize: 16,
  },
  webContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  webText: {
    fontSize: 18,
    textAlign: 'center',
    color: '#666',
  },
  message: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 18,
    color: '#666',
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    flex: 1,
  },
  barcodeGuide: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -50 }],
    width: 200,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 10,
  },
  guideText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  scannedInfo: {
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  scannedLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  scannedCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  rescanButton: {
    backgroundColor: '#5a7559',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  rescanText: {
    color: '#fff',
    fontSize: 16,
  },
  resultCard: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 5,
  },
  productBrand: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  productCode: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});