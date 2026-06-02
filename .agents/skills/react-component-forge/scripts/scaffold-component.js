#!/usr/bin/env node
/**
 * TFI Component Scaffolder
 * 
 * Usage: node scaffold-component.js PageName
 * 
 * Creates:
 *   frontend/src/pages/PageName/PageName.tsx
 *   frontend/src/pages/PageName/PageName.css
 * 
 * Or for components:
 *   node scaffold-component.js ComponentName --component
 *   Creates: frontend/src/components/ComponentName.tsx
 */

const fs = require('fs');
const path = require('path');

const name = process.argv[2];
const isComponent = process.argv.includes('--component');

if (!name) {
  console.error('Usage: node scaffold-component.js <Name> [--component]');
  process.exit(1);
}

const frontendSrc = path.join(__dirname, '..', '..', '..', 'frontend', 'src');

if (isComponent) {
  // Simple component
  const filePath = path.join(frontendSrc, 'components', `${name}.tsx`);
  
  const content = `import { motion } from 'framer-motion';
import { cinematicItem } from './AnimatedPage';

interface ${name}Props {
  // Add props here
}

export default function ${name}({}: ${name}Props) {
  return (
    <motion.div variants={cinematicItem}>
      <div className="${name.toLowerCase()}">
        {/* ${name} content */}
      </div>
    </motion.div>
  );
}
`;

  fs.writeFileSync(filePath, content);
  console.log(`✅ Created component: ${filePath}`);

} else {
  // Page component with CSS
  const pageDir = path.join(frontendSrc, 'pages', name);
  fs.mkdirSync(pageDir, { recursive: true });

  const cssClass = name.replace(/([A-Z])/g, '-$1').toLowerCase().slice(1) + '-page';

  const tsxContent = `import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedPage, { cinematicItem } from '../../components/AnimatedPage';
import { useAuth } from '../../context/AuthContext';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import './${name}.css';

export default function ${name}() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data here
    setLoading(false);
  }, []);

  return (
    <AnimatedPage className="${cssClass}">
      <div className="container">
        <motion.div className="section-header" variants={cinematicItem}>
          <p className="section-subtitle">${name}</p>
          <h1 className="section-title">${name}</h1>
          <div className="section-divider" />
        </motion.div>

        {loading ? (
          <div className="skeleton" style={{ height: 300 }} />
        ) : (
          <motion.div variants={cinematicItem}>
            {/* Page content */}
          </motion.div>
        )}
      </div>
    </AnimatedPage>
  );
}
`;

  const cssContent = `/* ${name} Page */

.${cssClass} {
  /* standard-page-padding is auto-applied by AnimatedPage */
}

.${cssClass} .container {
  max-width: var(--container-max-width, 1200px);
  margin: 0 auto;
  padding: 0 var(--container-padding, 24px);
}

/* Responsive */
@media (max-width: 768px) {
  .${cssClass} .container {
    padding: 0 16px;
  }
}
`;

  fs.writeFileSync(path.join(pageDir, `${name}.tsx`), tsxContent);
  fs.writeFileSync(path.join(pageDir, `${name}.css`), cssContent);
  console.log(`✅ Created page: ${pageDir}/${name}.tsx`);
  console.log(`✅ Created CSS:  ${pageDir}/${name}.css`);
  console.log(`\n📝 Don't forget to add the route in App.tsx:`);
  console.log(`   import ${name} from './pages/${name}/${name}';`);
  console.log(`   <Route path="/${name.toLowerCase()}" element={<${name} />} />`);
}
