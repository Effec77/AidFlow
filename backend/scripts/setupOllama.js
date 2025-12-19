#!/usr/bin/env node

/**
 * Ollama Setup Script for AidFlow AI Emergency Decision Agent
 * This script helps set up Ollama with the required models
 */

import fetch from 'node-fetch';
import { spawn } from 'child_process';
import dotenv from 'dotenv';

dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1:8b';

class OllamaSetup {
    constructor() {
        this.ollamaUrl = OLLAMA_URL;
        this.modelName = OLLAMA_MODEL;
    }

    async checkOllamaInstallation() {
        console.log('🔍 Checking Ollama installation...');
        
        try {
            const response = await fetch(`${this.ollamaUrl}/api/version`);
            if (response.ok) {
                const version = await response.json();
                console.log(`✅ Ollama is running (version: ${version.version || 'unknown'})`);
                return true;
            }
        } catch (error) {
            console.log('❌ Ollama is not running or not installed');
            console.log('\n📥 Please install Ollama:');
            console.log('   • Visit: https://ollama.ai/download');
            console.log('   • Or run: curl -fsSL https://ollama.ai/install.sh | sh');
            console.log('   • Then start Ollama: ollama serve');
            return false;
        }
    }

    async listAvailableModels() {
        try {
            const response = await fetch(`${this.ollamaUrl}/api/tags`);
            if (response.ok) {
                const data = await response.json();
                return data.models || [];
            }
        } catch (error) {
            console.error('Failed to list models:', error.message);
            return [];
        }
    }

    async pullModel(modelName) {
        console.log(`📥 Pulling model: ${modelName}...`);
        console.log('⏳ This may take several minutes depending on model size...');

        try {
            const response = await fetch(`${this.ollamaUrl}/api/pull`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: modelName })
            });

            if (response.ok) {
                // Stream the response to show progress
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line);
                            if (data.status) {
                                process.stdout.write(`\r📥 ${data.status}`);
                                if (data.completed && data.total) {
                                    const percent = Math.round((data.completed / data.total) * 100);
                                    process.stdout.write(` (${percent}%)`);
                                }
                            }
                        } catch (e) {
                            // Ignore JSON parse errors
                        }
                    }
                }

                console.log(`\n✅ Model ${modelName} pulled successfully!`);
                return true;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`\n❌ Failed to pull model ${modelName}:`, error.message);
            return false;
        }
    }

    async testModel(modelName) {
        console.log(`🧪 Testing model: ${modelName}...`);

        const testPrompt = `You are an emergency response AI. Analyze this situation and respond with a JSON object containing "severity" (low/medium/high/critical) and "action" (wait/dispatch/evacuate):

Emergency: "Flash flood reported in residential area, water rising rapidly, families trapped on rooftops"

Respond only with valid JSON:`;

        try {
            const response = await fetch(`${this.ollamaUrl}/api/generate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelName,
                    prompt: testPrompt,
                    stream: false,
                    options: {
                        temperature: 0.3,
                        num_predict: 200
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Model test successful!');
                console.log('📝 Sample response:', data.response.substring(0, 200) + '...');
                return true;
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('❌ Model test failed:', error.message);
            return false;
        }
    }

    async recommendedModels() {
        return [
            {
                name: 'llama3.1:8b',
                description: 'Recommended - Good balance of performance and resource usage',
                size: '~4.7GB',
                ram: '8GB recommended'
            },
            {
                name: 'llama3.1:70b',
                description: 'High performance - Best accuracy for complex decisions',
                size: '~40GB',
                ram: '64GB recommended'
            },
            {
                name: 'mistral:7b',
                description: 'Alternative - Fast and efficient',
                size: '~4.1GB',
                ram: '8GB recommended'
            },
            {
                name: 'codellama:13b',
                description: 'Good for structured outputs',
                size: '~7.3GB',
                ram: '16GB recommended'
            }
        ];
    }

    async setup() {
        console.log('🚀 AidFlow AI - Ollama Setup for Emergency Decision Agent');
        console.log('=' .repeat(60));

        // Step 1: Check Ollama installation
        const ollamaRunning = await this.checkOllamaInstallation();
        if (!ollamaRunning) {
            process.exit(1);
        }

        // Step 2: List available models
        console.log('\n📋 Checking available models...');
        const availableModels = await this.listAvailableModels();
        
        if (availableModels.length > 0) {
            console.log('✅ Available models:');
            availableModels.forEach(model => {
                console.log(`   • ${model.name} (${(model.size / 1024 / 1024 / 1024).toFixed(1)}GB)`);
            });
        } else {
            console.log('📭 No models installed yet');
        }

        // Step 3: Check if required model exists
        const modelExists = availableModels.some(model => 
            model.name.includes(this.modelName.split(':')[0])
        );

        if (!modelExists) {
            console.log(`\n❌ Required model ${this.modelName} not found`);
            console.log('\n🎯 Recommended models for emergency decision making:');
            
            const recommended = await this.recommendedModels();
            recommended.forEach((model, index) => {
                console.log(`   ${index + 1}. ${model.name}`);
                console.log(`      ${model.description}`);
                console.log(`      Size: ${model.size}, RAM: ${model.ram}`);
                console.log('');
            });

            console.log(`📥 Pulling default model: ${this.modelName}`);
            const pullSuccess = await this.pullModel(this.modelName);
            
            if (!pullSuccess) {
                console.log('\n💡 Try pulling a smaller model if you have limited resources:');
                console.log('   ollama pull llama3.1:8b');
                process.exit(1);
            }
        } else {
            console.log(`✅ Required model ${this.modelName} is available`);
        }

        // Step 4: Test the model
        console.log('\n🧪 Testing model functionality...');
        const testSuccess = await this.testModel(this.modelName);
        
        if (testSuccess) {
            console.log('\n🎉 Ollama setup complete!');
            console.log('✅ Emergency Decision Agent is ready to use');
            console.log('\n🚀 You can now start the AidFlow AI server:');
            console.log('   npm run dev');
        } else {
            console.log('\n⚠️ Model test failed. The model may still work, but consider trying a different model.');
        }

        console.log('\n📚 Useful Ollama commands:');
        console.log('   ollama list                    # List installed models');
        console.log('   ollama pull <model>           # Pull a new model');
        console.log('   ollama rm <model>             # Remove a model');
        console.log('   ollama serve                  # Start Ollama server');
    }
}

// Run setup if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    const setup = new OllamaSetup();
    setup.setup().catch(console.error);
}

export default OllamaSetup;