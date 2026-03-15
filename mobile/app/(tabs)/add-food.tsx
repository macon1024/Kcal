import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, TextInput, Button, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import axios from 'axios';

import { API_URL } from '@/constants/api';
import { AuthContext } from '@/context/AuthContext';

export default function AddFoodScreen() {
  const [foods, setFoods] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<string>('');
  const [quantity, setQuantity] = useState('1');
  const [mealType, setMealType] = useState('breakfast');
  
  // Camera State
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);

  // New Food Form State
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCalories, setNewFoodCalories] = useState('');
  const [newFoodProtein, setNewFoodProtein] = useState('');
  const [newFoodCarbs, setNewFoodCarbs] = useState('');
  const [newFoodFat, setNewFoodFat] = useState('');
  const [newFoodServingSize, setNewFoodServingSize] = useState('100g');
  const [newFoodBaseAmount, setNewFoodBaseAmount] = useState('100');
  const [newFoodBaseUnit, setNewFoodBaseUnit] = useState('g');
  const [loadingAutoFill, setLoadingAutoFill] = useState(false);

  const { user } = useContext(AuthContext);
  const userId = user?.id;
  const today = new Date().toISOString().split('T')[0];

  const fetchFoods = async () => {
    try {
      const res = await axios.get(`${API_URL}/foods`);
      setFoods(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchFoods();
  }, []);

  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    setScanned(true);
    setShowScanner(false);
    setLoadingAutoFill(true);
    Alert.alert('Scanned!', `Barcode: ${data}`);

    try {
      const res = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${data}.json`);
      if (res.data.status === 1) {
        const product = res.data.product;
        const nutriments = product.nutriments || {};
        setNewFoodName(product.product_name || '');
        setNewFoodCalories(String(Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal_serving'] || nutriments['energy-kcal'] || 0)));
        setNewFoodProtein(String(Math.round(nutriments.proteins_100g || nutriments.proteins_serving || nutriments.proteins || 0)));
        setNewFoodCarbs(String(Math.round(nutriments.carbohydrates_100g || nutriments.carbohydrates_serving || nutriments.carbohydrates || 0)));
        setNewFoodFat(String(Math.round(nutriments.fat_100g || nutriments.fat_serving || nutriments.fat || 0)));
        setNewFoodServingSize(product.serving_size || '100g');
        setNewFoodBaseAmount('100');
        setNewFoodBaseUnit('g');
        Alert.alert('Success', 'Product found!');
      } else {
        Alert.alert('Not Found', 'Product not found in database.');
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to fetch product data.');
    } finally {
      setLoadingAutoFill(false);
    }
  };

  const openScanner = async () => {
    if (!permission) {
        // Permissions are still loading
        return;
    }
    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission needed', 'Camera permission is required to scan barcodes.');
        return;
      }
    }
    setScanned(false);
    setShowScanner(true);
  };

  const handleAutoFill = async () => {
    if (!newFoodName) {
      Alert.alert('Error', 'Please enter a food name first');
      return;
    }
    setLoadingAutoFill(true);
    try {
      const res = await axios.get(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${newFoodName}&search_simple=1&action=process&json=1`);
      if (res.data.products && res.data.products.length > 0) {
        const product = res.data.products[0];
        const nutriments = product.nutriments || {};
        setNewFoodName(product.product_name || newFoodName);
        setNewFoodCalories(String(Math.round(nutriments['energy-kcal_100g'] || nutriments['energy-kcal_serving'] || nutriments['energy-kcal'] || 0)));
        setNewFoodProtein(String(Math.round(nutriments.proteins_100g || nutriments.proteins_serving || nutriments.proteins || 0)));
        setNewFoodCarbs(String(Math.round(nutriments.carbohydrates_100g || nutriments.carbohydrates_serving || nutriments.carbohydrates || 0)));
        setNewFoodFat(String(Math.round(nutriments.fat_100g || nutriments.fat_serving || nutriments.fat || 0)));
        setNewFoodServingSize(product.serving_size || '100g');
        setNewFoodBaseAmount('100');
        setNewFoodBaseUnit('g');
        Alert.alert('Success', 'Found and filled nutrition data!');
      } else {
        Alert.alert('Not Found', 'No data found for this food.');
      }
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to fetch data.');
    } finally {
      setLoadingAutoFill(false);
    }
  };

  const handleAddFood = async () => {
    try {
      const res = await axios.post(`${API_URL}/foods`, {
        name: newFoodName,
        calories: Number(newFoodCalories),
        protein: Number(newFoodProtein),
        carbs: Number(newFoodCarbs),
        fat: Number(newFoodFat),
        servingSize: newFoodServingSize,
        baseAmount: Number(newFoodBaseAmount),
        baseUnit: newFoodBaseUnit
      });
      setFoods([...foods, res.data]);
      setNewFoodName('');
      setNewFoodCalories('');
      setNewFoodProtein('');
      setNewFoodCarbs('');
      setNewFoodFat('');
      setNewFoodServingSize('100g');
      setNewFoodBaseAmount('100');
      setNewFoodBaseUnit('g');
      Alert.alert('Success', 'Food created!');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to create food');
    }
  };

  const handleLogMeal = async () => {
    if (!selectedFood) {
      Alert.alert('Error', 'Please select a food');
      return;
    }

    try {
      await axios.post(`${API_URL}/logs`, {
        userId,
        date: today,
        meals: [{ 
          foodId: selectedFood, 
          quantity: Number(quantity), 
          unit: foods.find(f => f._id === selectedFood)?.baseUnit || 'g',
          mealType 
        }]
      });
      Alert.alert('Success', 'Meal logged!');
    } catch (err) {
      console.log(err);
      Alert.alert('Error', 'Failed to log meal');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Add Food</Text>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Log Meal</Text>
        <Text style={styles.label}>Select Food:</Text>
        <ScrollView horizontal style={styles.foodList}>
          {foods.map(food => (
            <TouchableOpacity 
              key={food._id} 
              style={[styles.foodChip, selectedFood === food._id && styles.selectedFoodChip]}
              onPress={() => setSelectedFood(food._id)}
            >
              <Text style={[styles.foodChipText, selectedFood === food._id && styles.selectedFoodChipText]}>
                {food.name} ({food.calories} kcal)
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TextInput
          style={styles.input}
          placeholder={`Amount in ${foods.find(f => f._id === selectedFood)?.baseUnit || 'units'}`}
          value={quantity}
          onChangeText={setQuantity}
          keyboardType="numeric"
        />

        <View style={styles.mealTypeContainer}>
          {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
            <TouchableOpacity 
              key={type} 
              style={[styles.typeChip, mealType === type && styles.selectedTypeChip]}
              onPress={() => setMealType(type)}
            >
              <Text style={[styles.typeChipText, mealType === type && styles.selectedTypeChipText]}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Log Meal" onPress={handleLogMeal} />
      </View>

      <View style={styles.section}>
        <Text style={styles.subtitle}>Create New Food</Text>
        
        {/* Scanner Modal */}
        <Modal visible={showScanner} animationType="slide">
          <View style={styles.scannerContainer}>
            <CameraView 
              style={StyleSheet.absoluteFillObject}
              onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr", "ean13", "ean8", "upc_a", "upc_e"],
              }}
            />
            <View style={styles.scannerOverlay}>
              <Text style={styles.scannerText}>Scan a food barcode</Text>
              <Button title="Cancel" onPress={() => setShowScanner(false)} color="red" />
            </View>
          </View>
        </Modal>

        <View style={styles.searchRow}>
          <TextInput style={[styles.input, styles.searchInput]} placeholder="Name" value={newFoodName} onChangeText={setNewFoodName} />
          <TouchableOpacity style={[styles.searchButton, {marginRight: 5}]} onPress={handleAutoFill} disabled={loadingAutoFill}>
            <Text style={styles.searchButtonText}>{loadingAutoFill ? '...' : 'Auto'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.searchButton, {backgroundColor: '#666'}]} onPress={openScanner}>
            <Text style={styles.searchButtonText}>Scan</Text>
          </TouchableOpacity>
        </View>
        <TextInput style={styles.input} placeholder="Calories" value={newFoodCalories} onChangeText={setNewFoodCalories} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Protein (g)" value={newFoodProtein} onChangeText={setNewFoodProtein} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Carbs (g)" value={newFoodCarbs} onChangeText={setNewFoodCarbs} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Fat (g)" value={newFoodFat} onChangeText={setNewFoodFat} keyboardType="numeric" />
        <TextInput style={styles.input} placeholder="Serving Display (e.g., 1 cup)" value={newFoodServingSize} onChangeText={setNewFoodServingSize} />
        <View style={{flexDirection: 'row', gap: 10}}>
          <TextInput style={[styles.input, {flex: 1}]} placeholder="Base Amount" value={newFoodBaseAmount} onChangeText={setNewFoodBaseAmount} keyboardType="numeric" />
          <TextInput style={[styles.input, {flex: 1}]} placeholder="Unit (g/ml)" value={newFoodBaseUnit} onChangeText={setNewFoodBaseUnit} />
        </View>
        <Button title="Create Food" onPress={handleAddFood} color="#2e78b7" />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
  },
  label: {
    marginBottom: 5,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  foodList: {
    flexDirection: 'row',
    marginBottom: 10,
    height: 50,
  },
  foodChip: {
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 10,
    height: 40,
  },
  selectedFoodChip: {
    backgroundColor: '#2e78b7',
  },
  foodChipText: {
    color: '#333',
  },
  selectedFoodChipText: {
    color: '#fff',
  },
  mealTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 15,
  },
  typeChip: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
  },
  selectedTypeChip: {
    backgroundColor: '#2e78b7',
    borderColor: '#2e78b7',
  },
  typeChipText: {
    color: '#333',
  },
  selectedTypeChipText: {
    color: '#fff',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
    marginRight: 10,
  },
  searchButton: {
    backgroundColor: '#2e78b7',
    padding: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  scannerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  scannerOverlay: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  scannerText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
});
