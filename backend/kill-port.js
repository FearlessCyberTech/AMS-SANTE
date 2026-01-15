// backend/kill-port.js
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function killPort(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    if (stdout) {
      const lines = stdout.trim().split('\n');
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          console.log(`🛑 Arrêt du processus PID ${pid} sur le port ${port}...`);
          await execAsync(`taskkill /PID ${pid} /F`);
          console.log(`✅ Processus ${pid} arrêté`);
        }
      }
    }
    console.log(`✅ Port ${port} maintenant libre`);
  } catch (error) {
    console.log(`✅ Port ${port} déjà libre`);
  }
}

// Tuer le port 5000 par défaut
killPort(5000).then(() => {
  console.log('✅ Prêt à démarrer le serveur');
  process.exit(0);
});