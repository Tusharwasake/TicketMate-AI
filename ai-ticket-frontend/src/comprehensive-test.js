// Test script to verify all components are working correctly
console.log('Starting comprehensive test...');

// Test 1: Import all critical components
try {
  import('./pages/Profile.jsx').then(ProfileModule => {
    console.log('✅ Profile component imported successfully:', ProfileModule.default);
  }).catch(error => {
    console.error('❌ Profile import failed:', error);
  });

  import('./pages/Signup.jsx').then(SignupModule => {
    console.log('✅ Signup component imported successfully:', SignupModule.default);
  }).catch(error => {
    console.error('❌ Signup import failed:', error);
  });

  import('./utils/storage.js').then(StorageModule => {
    console.log('✅ Storage utility imported successfully:', StorageModule.safeStorage);
    
    // Test storage functionality
    const { safeStorage } = StorageModule;
    safeStorage.setItem('test_item', 'test_value');
    const retrieved = safeStorage.getItem('test_item');
    
    if (retrieved === 'test_value') {
      console.log('✅ Storage functionality working correctly');
    } else {
      console.error('❌ Storage test failed - expected "test_value", got:', retrieved);
    }
    
    safeStorage.removeItem('test_item');
  }).catch(error => {
    console.error('❌ Storage import failed:', error);
  });

  import('./utils/api.js').then(ApiModule => {
    console.log('✅ API utility imported successfully:', ApiModule.apiClient);
  }).catch(error => {
    console.error('❌ API import failed:', error);
  });

} catch (error) {
  console.error('❌ Critical import test failed:', error);
}

// Test 2: Check if backend is reachable
fetch('http://localhost:4000/api/users/me', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
})
.then(response => {
  if (response.status === 401) {
    console.log('✅ Backend is reachable (401 expected without auth)');
  } else {
    console.log('✅ Backend responded with status:', response.status);
  }
})
.catch(error => {
  console.error('❌ Backend connection failed:', error);
});

console.log('Test script completed');
