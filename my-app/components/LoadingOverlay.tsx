import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export function LoadingOverlay() {
  const colorScheme = useColorScheme();
  
  const isDark = colorScheme === 'dark';
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: 'rgba(0, 0, 0, 0.3)' }
    ]}>
      <View style={[
        styles.content,
        {
          backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        }
      ]}>
        <ActivityIndicator 
          size="large" 
          color={Colors[colorScheme ?? 'light'].tint} 
        />
        <ThemedText style={styles.text}>Loading...</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    minWidth: 150,
    minHeight: 100,
  },
  text: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: '500',
  },
});
