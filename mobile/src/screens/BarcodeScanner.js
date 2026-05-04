import { useEffect, useRef, useState } from 'react';
import { Camera, CameraView } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import {
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  FlatList,
  Modal,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
} from 'react-native';
import {
  getPantryItems,
  associateUPCWithPantryItem,
  addPantryItem,
} from '../services/api';

export default function BarcodeScanner({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scannedCode, setScannedCode] = useState('');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const [showPantryModal, setShowPantryModal] = useState(false);
  const [pantryItems, setPantryItems] = useState([]);
  const [loadingPantry, setLoadingPantry] = useState(false);
  const [selectedSharedMode, setSelectedSharedMode] = useState(false);
  const [quantityInput, setQuantityInput] = useState('1');
  const [unitInput, setUnitInput] = useState('pieces');

  const scanLockRef = useRef(false);

  const guessUnit = (name) => {
    const n = String(name || '').toLowerCase();

    if (
      ['milk', 'oil', 'juice', 'water', 'soda', 'drink', 'tea', 'coffee', 'sauce'].some((k) =>
        n.includes(k)
      )
    ) {
      return 'ml';
    }

    if (
      ['flour', 'sugar', 'rice', 'pasta', 'cereal', 'salt', 'powder', 'beans'].some((k) =>
        n.includes(k)
      )
    ) {
      return 'grams';
    }

    return 'pieces';
  };

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

  const lookupProduct = async (codeOverride) => {
    const codeToLookup = (codeOverride ?? scannedCode).trim();

    if (!codeToLookup) {
      setError('Please scan a barcode or try again.');
      scanLockRef.current = false;
      return;
    }

    setLoading(true);
    setError('');
    setProduct(null);

    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/api/v0/product/${codeToLookup}.json`,
        {
          headers: {
            Accept: 'application/json',
          },
        }
      );

      console.log('OpenFoodFacts status:', response.status);

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.status}`);
      }

      const result = await response.json();

      if (result.status === 1 && result.product) {
        const productName =
          result.product.product_name ||
          result.product.generic_name ||
          'Unknown product';

        setProduct({
          name: productName,
          brand: result.product.brands,
          code: codeToLookup,
        });

        setQuantityInput('1');
        setUnitInput(guessUnit(productName));
        setIsScanning(false);
      } else {
        setError('Product not found. You can pick it from your pantry.');
        setIsScanning(false);
      }
    } catch (err) {
      setError('Could not lookup barcode. You can pick it from your pantry.');
      console.error('Barcode lookup error:', err.message || err);
      setIsScanning(false);
    } finally {
      setLoading(false);
    }
  };

  const handleBarcodeScanned = (result) => {
    if (scanLockRef.current || !isScanning) return;

    scanLockRef.current = true;

    const detectedCode = result.data;
    console.log('Barcode scanned:', detectedCode);

    setScannedCode(detectedCode);
    setIsScanning(false);
    lookupProduct(detectedCode);
  };

  const resetScanner = () => {
    Keyboard.dismiss();
    scanLockRef.current = false;
    setScannedCode('');
    setProduct(null);
    setError('');
    setQuantityInput('1');
    setUnitInput('pieces');
    setIsScanning(true);
  };

  const openPantrySelection = async (isShared = false) => {
    Keyboard.dismiss();
    setSelectedSharedMode(isShared);
    setLoadingPantry(true);
    setShowPantryModal(true);

    try {
      const items = await getPantryItems(isShared);
      setPantryItems(items);
    } catch (_error) {
      console.log('Could not load pantry items');
      setPantryItems([]);
    } finally {
      setLoadingPantry(false);
    }
  };

  const selectPantryItem = async (pantryItem) => {
    try {
      setLoading(true);

      await associateUPCWithPantryItem(
        pantryItem.id,
        scannedCode,
        selectedSharedMode
      );

      setProduct({
        name: pantryItem.name,
        code: scannedCode,
        fromPantry: true,
        shared: selectedSharedMode,
      });

      setError('');
      setShowPantryModal(false);
    } catch (error) {
      console.error('Error associating UPC:', error);
      setError('Failed to associate UPC with pantry item');
    } finally {
      setLoading(false);
    }
  };

  const addScannedToPantry = async (isShared = false) => {
    if (!product?.name) return;

    Keyboard.dismiss();

    const quantity = parseFloat(quantityInput);

    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Invalid Quantity', 'Please enter a valid quantity.');
      return;
    }

    try {
      setLoading(true);

      await addPantryItem(
        {
          name: product.name,
          quantity,
          unit: unitInput.trim() || 'pieces',
        },
        isShared
      );

      Alert.alert(
        'Added',
        isShared
          ? 'Item added to shared pantry.'
          : 'Item added to your pantry.'
      );
    } catch (error) {
      console.error('Error adding scanned item:', error);
      Alert.alert('Error', 'Failed to add item to pantry.');
    } finally {
      setLoading(false);
    }
  };

  const renderResultContent = () => {
    if (loading) {
      return (
        <View style={styles.resultCard}>
          <ActivityIndicator size="large" color="#5a7559" />
          <Text style={styles.loadingText}>Searching for product...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.resultCard}>
          <Text style={styles.errorText}>{error}</Text>

          <TouchableOpacity
            style={styles.pantryButton}
            onPress={() => openPantrySelection(false)}
          >
            <Text style={styles.pantryButtonText}>Pick from My Pantry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.pantryButton}
            onPress={() => openPantrySelection(true)}
          >
            <Text style={styles.pantryButtonText}>Pick from Shared Pantry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (product) {
      return (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={80}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.resultCard}
          >
            <Text style={styles.productName}>{product.name}</Text>

            {product.brand && (
              <Text style={styles.productBrand}>{product.brand}</Text>
            )}

            <Text style={styles.productCode}>UPC: {product.code}</Text>

            {product.fromPantry && (
              <Text style={styles.pantryNote}>
                Associated from {product.shared ? 'shared pantry' : 'your pantry'}
              </Text>
            )}

            {!product.fromPantry && (
              <>
                <View style={styles.inputRow}>
                  <View style={styles.inputBox}>
                    <Text style={styles.inputLabel}>Quantity</Text>
                    <TextInput
                      style={styles.smallInput}
                      value={quantityInput}
                      onChangeText={setQuantityInput}
                      keyboardType="numeric"
                      placeholder="Qty"
                      placeholderTextColor="#999"
                    />
                  </View>

                  <View style={styles.inputBox}>
                    <Text style={styles.inputLabel}>Unit</Text>
                    <TextInput
                      style={styles.smallInput}
                      value={unitInput}
                      onChangeText={setUnitInput}
                      placeholder="grams / ml / pieces"
                      placeholderTextColor="#999"
                      returnKeyType="done"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.pantryButton}
                  onPress={() => addScannedToPantry(false)}
                >
                  <Text style={styles.pantryButtonText}>Add to My Pantry</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pantryButton}
                  onPress={() => addScannedToPantry(true)}
                >
                  <Text style={styles.pantryButtonText}>Add to Shared Pantry</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Scan UPC</Text>

        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
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
              facing="back"
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

              <TouchableOpacity style={styles.rescanButton} onPress={resetScanner}>
                <Text style={styles.rescanText}>Scan Another</Text>
              </TouchableOpacity>
            </View>
          )}

          {renderResultContent()}
        </>
      )}

      <StatusBar style="light" />

      <Modal
        visible={showPantryModal}
        animationType="slide"
        onRequestClose={() => setShowPantryModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {selectedSharedMode
                ? 'Select Shared Pantry Item'
                : 'Select My Pantry Item'}
            </Text>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowPantryModal(false)}
            >
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {loadingPantry ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#5a7559" />
              <Text style={styles.loadingText}>Loading pantry...</Text>
            </View>
          ) : (
            <FlatList
              data={pantryItems}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pantryItem}
                  onPress={() => selectPantryItem(item)}
                >
                  <Text style={styles.pantryItemName}>{item.name}</Text>
                  <Text style={styles.pantryItemQuantity}>
                    {item.quantity} {item.unit}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No items in pantry</Text>
              }
            />
          )}
        </SafeAreaView>
      </Modal>
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
    paddingBottom: 30,
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
  pantryNote: {
    fontSize: 12,
    color: '#5a7559',
    textAlign: 'center',
    marginTop: 5,
    fontStyle: 'italic',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    width: '100%',
  },
  inputBox: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    fontWeight: '600',
  },
  smallInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  pantryButton: {
    backgroundColor: '#5a7559',
    padding: 12,
    borderRadius: 5,
    marginTop: 10,
    alignItems: 'center',
    width: '100%',
  },
  pantryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#5a7559',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pantryItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  pantryItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  pantryItemQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 50,
  },
});