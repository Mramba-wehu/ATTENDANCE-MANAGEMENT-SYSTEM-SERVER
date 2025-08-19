import fs from 'fs-extra';

(async(): Promise<void> => {
    try {
        await fs.copy('.env', 'dist/.env');
        await fs.copy('src/assets', 'dist/assets')
        console.log('✅ Assets copied successfully!');
    } catch (error: any) {
        console.error('❌ Error copying assets:', error);
        process.exit(1);
    }
})()