// Test file to verify all imports work correctly
import ProfilePage from './pages/Profile.jsx';
import { safeStorage } from './utils/storage.js';

console.log('Profile component imported successfully:', ProfilePage);
console.log('Storage utility imported successfully:', safeStorage);

// Test storage functionality
try {
  safeStorage.setItem('test', 'value');
  const retrieved = safeStorage.getItem('test');
  console.log('Storage test successful:', retrieved === 'value');
  safeStorage.removeItem('test');
} catch (error) {
  console.error('Storage test failed:', error);
}
