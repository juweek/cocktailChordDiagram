import React, { useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface CarouselSlide {
  title: string;
  description: string;
}

const slides: CarouselSlide[] = [
  {
    title: "Explore Ingredients",
    description: "Discover cocktails through our interactive chord diagram. See how ingredients connect and find new combinations."
  },
  {
    title: "Find Connections",
    description: "Click on any ingredient to see what it pairs well with. The thicker the line, the more common the combination."
  },
  {
    title: "Filter by Category",
    description: "Use the outer ring to filter ingredients by category. See patterns between different types of ingredients."
  },
  {
    title: "Get Details",
    description: "Tap on any ingredient to see detailed information, including all cocktails it's used in."
  },
  {
    title: "Start Mixing",
    description: "Ready to make something? Find cocktails that use ingredients you already have!"
  }
];

export function TextCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;
  const colorScheme = useColorScheme();

  const handleScroll = (event: any) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / screenWidth);
    setActiveIndex(index);
  };

  const handleDotPress = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: true
    });
    setActiveIndex(index);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {slides.map((slide, index) => (
          <View 
            key={index} 
            style={[
              styles.slide, 
              { 
                width: screenWidth,
                backgroundColor: Colors[colorScheme ?? 'light'].background
              }
            ]}
          >
            <View style={styles.textContainer}>
              <ThemedText style={styles.title}>{slide.title}</ThemedText>
              <ThemedText style={styles.description}>{slide.description}</ThemedText>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handleDotPress(index)}
            style={[
              styles.paginationDot,
              {
                backgroundColor: index === activeIndex 
                  ? Colors[colorScheme ?? 'light'].tint
                  : Colors[colorScheme ?? 'light'].tabIconDefault
              }
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    maxWidth: 600,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 28,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
});
