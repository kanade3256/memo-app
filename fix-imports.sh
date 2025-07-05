#!/bin/bash

# Notes components
find src/components/notes -name "*.tsx" -exec sed -i "s|from '../firebase'|from '../../config/firebase'|g" {} \;
find src/components/notes -name "*.tsx" -exec sed -i "s|from '../contexts/|from '../../contexts/|g" {} \;
find src/components/notes -name "*.tsx" -exec sed -i "s|from '../types/|from '../../types/|g" {} \;
find src/components/notes -name "*.tsx" -exec sed -i "s|from './SearchBar'|from '../ui/SearchBar'|g" {} \;

# Admin components  
find src/components/admin -name "*.tsx" -exec sed -i "s|from '../firebase'|from '../../config/firebase'|g" {} \;
find src/components/admin -name "*.tsx" -exec sed -i "s|from '../contexts/|from '../../contexts/|g" {} \;
find src/components/admin -name "*.tsx" -exec sed -i "s|from '../types/|from '../../types/|g" {} \;
find src/components/admin -name "*.tsx" -exec sed -i "s|from '../utils/|from '../../utils/|g" {} \;

# Auth components
find src/components/auth -name "*.tsx" -exec sed -i "s|from '../firebase'|from '../../config/firebase'|g" {} \;
find src/components/auth -name "*.tsx" -exec sed -i "s|from '../contexts/|from '../../contexts/|g" {} \;
find src/components/auth -name "*.tsx" -exec sed -i "s|from '../types/|from '../../types/|g" {} \;
find src/components/auth -name "*.tsx" -exec sed -i "s|from './LoginHistory'|from '../admin/LoginHistory'|g" {} \;

# UI components
find src/components/ui -name "*.tsx" -exec sed -i "s|from '../hooks/|from '../../hooks/|g" {} \;
find src/components/ui -name "*.tsx" -exec sed -i "s|from '../contexts/|from '../../contexts/|g" {} \;
find src/components/ui -name "*.tsx" -exec sed -i "s|from '../types/|from '../../types/|g" {} \;

# Threads components
find src/components/threads -name "*.tsx" -exec sed -i "s|from '../types/|from '../../types/|g" {} \;
