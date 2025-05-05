const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Fungsi utama untuk deployment
async function deploy() {
  console.log('🚀 FACTS Dashboard Deployment Helper (Mode Simulasi)');
  console.log('========================================================');
  
  // 1. Pastikan file konfigurasi mode simulasi ada
  ensureSimulationMode();
  
  // 2. Deploy ke Vercel
  deployToVercel();
  
  console.log('========================================================');
  console.log('✅ Proses deployment selesai!');
}

// Pastikan mode simulasi diaktifkan di semua file konfigurasi
function ensureSimulationMode() {
  console.log('🔍 Memastikan mode simulasi aktif...');
  
  // Check vercel.json
  const vercelConfigPath = path.join(process.cwd(), 'vercel.json');
  if (fs.existsSync(vercelConfigPath)) {
    let vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    if (!vercelConfig.env) {
      vercelConfig.env = {};
    }
    vercelConfig.env.NEXT_PUBLIC_SIMULATION_MODE = "true";
    fs.writeFileSync(vercelConfigPath, JSON.stringify(vercelConfig, null, 2));
    console.log('✅ vercel.json: Mode simulasi aktif');
  }
  
  // Check .env.production
  const envProductionPath = path.join(process.cwd(), '.env.production');
  if (fs.existsSync(envProductionPath)) {
    let envContent = fs.readFileSync(envProductionPath, 'utf8');
    if (!envContent.includes('NEXT_PUBLIC_SIMULATION_MODE=true')) {
      envContent += '\nNEXT_PUBLIC_SIMULATION_MODE=true\n';
      fs.writeFileSync(envProductionPath, envContent);
    }
    console.log('✅ .env.production: Mode simulasi aktif');
  }
  
  console.log('✅ Mode simulasi diaktifkan di semua file konfigurasi');
}

// Deploy ke Vercel
function deployToVercel() {
  console.log('🚀 Memulai deployment ke Vercel...');
  
  try {
    // Cek apakah Vercel CLI terinstall
    try {
      execSync('vercel --version', { stdio: 'pipe' });
    } catch (e) {
      console.log('🔍 Vercel CLI tidak terinstall, menginstall...');
      execSync('npm i -g vercel', { stdio: 'inherit' });
    }
    
    // Deploy ke Vercel dengan flag --prod
    console.log('🚀 Menjalankan Vercel deploy dengan mode simulasi...');
      
    execSync('vercel --prod --build-env NEXT_PUBLIC_SIMULATION_MODE=true', { 
      stdio: 'inherit',
      env: { 
        ...process.env, 
        NEXT_PUBLIC_SIMULATION_MODE: 'true',
        CI: 'false',
        NEXT_IGNORE_TS_ERRORS: 'true'
      } 
    });
    
    console.log('✅ Deployment selesai!');
  } catch (error) {
    console.error('❌ Error deployment:', error);
    console.log('💡 Coba periksa log dengan: vercel logs <deployment-url>');
    process.exit(1);
  }
}

// Run deployment
deploy(); 