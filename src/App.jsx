diff --git a/src/App.jsx b/src/App.jsx
index 15890cab..00000000
--- a/src/App.jsx
+++ b/src/App.jsx
@@
-import React, { useState, useEffect, useMemo } from 'react';
-import PomodoroTimer from './components/PomodoroTimer';
+import React, { useState, useEffect, useMemo } from 'react';
+import PomodoroTimer from './components/PomodoroTimer';
+import FAB from './components/FAB';
@@
       </main>
+      {/* Floating Add button (portal) */}
+      <FAB onClick={() => setIsAddModalOpen(true)} />
     </div>
   );
 }
