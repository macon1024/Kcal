import React, { useState, useEffect, useContext } from 'react';
import { StyleSheet, View, Text, ScrollView, RefreshControl, Button } from 'react-native';
import axios from 'axios';

import { API_URL } from '@/constants/api'; 
import { AuthContext } from '@/context/AuthContext';

export default function DashboardScreen() {
  const [logs, setLogs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const { user, logout } = useContext(AuthContext);
  const userId = user?.id;
  const today = new Date().toISOString().split('T')[0];

  const fetchLogs = async () => {
    try {
      const res = await axios.get(`${API_URL}/logs/${userId}/${today}`);
      setLogs(res.data);
    } catch (err) {
      console.log(err);
      setLogs(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchLogs();
  }, []);

  const totalCalories = logs?.meals?.reduce((acc: number, meal: any) => {
    if (!meal.foodId) return acc;
    const baseAmount = meal.foodId.baseAmount || 1;
    const ratio = meal.quantity / baseAmount;
    return acc + (meal.foodId.calories * ratio);
  }, 0) || 0;

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Daily Summary</Text>
          <Text style={styles.subtitle}>{today}</Text>
        </View>
        <Button title="Logout" onPress={logout} color="#ff4d4d" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Calories Consumed</Text>
        <Text style={styles.calories}>{Math.round(totalCalories)} kcal</Text>
      </View>

      <Text style={styles.sectionTitle}>Meals</Text>
      {logs?.meals?.length > 0 ? (
        logs.meals.map((meal: any, index: number) => {
          const baseAmount = meal.foodId?.baseAmount || 1;
          const ratio = meal.quantity / baseAmount;
          const mealCalories = Math.round((meal.foodId?.calories || 0) * ratio);

          return (
            <View key={index} style={styles.mealItem}>
              <Text style={styles.mealName}>{meal.foodId?.name || 'Unknown'}</Text>
              <Text style={styles.mealDetails}>
                {meal.quantity}{meal.unit || meal.foodId?.baseUnit || 'g'} ({meal.mealType})
              </Text>
              <Text style={styles.mealCalories}>
                {mealCalories} kcal
              </Text>
            </View>
          );
        })
      ) : (
        <Text style={styles.noData}>No meals logged today.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#f4f4f4',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  calories: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#2e78b7',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  mealItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  mealName: {
    fontSize: 18,
    fontWeight: '600',
  },
  mealDetails: {
    color: '#666',
    marginTop: 4,
  },
  mealCalories: {
    marginTop: 4,
    fontWeight: 'bold',
    color: '#2e78b7',
  },
  noData: {
    fontStyle: 'italic',
    color: '#999',
    marginTop: 10,
  },
});
