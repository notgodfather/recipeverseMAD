const fs = require('fs');
const _path = require('path');

const screens = [
  'auth/LoginScreen',
  'feed/FeedScreen',
  'search/SearchScreen',
  'create/CreateRecipeScreen',
  'trending/TrendingScreen',
  'profile/ProfileScreen',
  'recipe/RecipeDetailScreen'
];

screens.forEach(screen => {
  const name = screen.split('/')[1];
  const content = `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ${name}() {
  return (
    <View style={styles.container}>
      <Text>${name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
`;
  
  const fullPath = _path.join(__dirname, 'src/screens', screen + '.tsx');
  fs.mkdirSync(_path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content);
});

console.log('Screens created');
