import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { TextCarousel } from '@/components/TextCarousel';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: Colors[colorScheme ?? 'light'].background }
    ]}>
      <View style={[
        styles.header,
        { borderBottomColor: 'rgba(0,0,0,0.1)' }
      ]}>
        <ThemedText style={styles.headerTitle}>
          How to use Gourmet Cocktails
        </ThemedText>
        <ThemedText style={styles.headerSubtitle}>
          Your interactive guide to cocktail ingredients
        </ThemedText>
      </View>
      
      <TextCarousel />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
});