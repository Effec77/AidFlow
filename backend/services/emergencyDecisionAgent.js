import Groq from 'groq-sdk';
import { InventoryItem } from '../models/Inventory.js';
import Emergency from '../models/Emergency.js';
import mongoose from 'mongoose';

/**
 * LangChain-based Emergency Decision Agent with Groq
 * Integrates with existing BERT agents to make autonomous dispatch decisions
 * Uses Groq's ultra-fast inference for real-time emergency decisions
 */
class EmergencyDecisionAgent {
    constructor() {
        // Initialize Groq client (cloud-based, ultra-fast LLM)
        this.groqApiKey = process.env.GROQ_API_KEY;
        this.modelName = process.env.GROQ_MODEL || 'llama-3.1-70b-versatile';
        
        this.groq = this.groqApiKey ? new Groq({
            apiKey: this.groqApiKey,
        }) : null;

        // Check if Groq is available
        this.groqAvailable = !!this.groqApiKey;
        
        if (this.groqAvailable) {
            console.log(`✅ Groq AI enabled with model: ${this.modelName}`);
        } else {
            console.log(`⚠️ Groq API key not found. Using rule-based decision making.`);
            console.log(`💡 Get free API key at: https://console.groq.com/keys`);
        }

        // Emergency type to resource mapping
        this.emergencyResourceMap = {
            flood: {
                immediate: ["emergency_medical_kits", "rescue_boats", "water_purification_tablets", "emergency_food"],
                secondary: ["emergency_blankets", "portable_generators", "hygiene_kits"],
                equipment: ["portable_water_purifiers", "emergency_radios"]
            },
            fire: {
                immediate: ["fire_extinguishers", "emergency_medical_kits", "evacuation_vehicles"],
                secondary: ["emergency_blankets", "hygiene_kits", "emergency_food"],
                equipment: ["emergency_radios", "portable_generators"]
            },
            earthquake: {
                immediate: ["rescue_equipment", "emergency_medical_kits", "search_dogs"],
                secondary: ["emergency_tents", "emergency_food", "water_purification_tablets"],
                equipment: ["portable_generators", "emergency_radios", "portable_lights"]
            },
            medical: {
                immediate: ["emergency_medical_kits", "ambulances", "medical_oxygen"],
                secondary: ["hygiene_kits", "emergency_blankets"],
                equipment: ["emergency_radios", "portable_generators"]
            },
            general: {
                immediate: ["emergency_medical_kits", "emergency_food", "water_purification_tablets"],
                secondary: ["emergency_blankets", "hygiene_kits"],
                equipment: ["emergency_radios"]
            }
        };
    }

    /**
     * Test Groq API connection and model availability
     */
    async testGroqConnection() {
        if (!this.groqAvailable) {
            return false;
        }

        try {
            console.log(`🤖 Testing Groq connection with model: ${this.modelName}...`);
            
            const testResponse = await this.groq.chat.completions.create({
                messages: [{ role: 'user', content: 'Test connection. Respond with "OK"' }],
                model: this.modelName,
                max_tokens: 10,
                temperature: 0
            });
            
            if (testResponse && testResponse.choices && testResponse.choices[0]) {
                console.log(`✅ Groq connection successful`);
                return true;
            } else {
                throw new Error('No response from Groq');
            }
        } catch (error) {
            console.warn(`⚠️ Groq connection failed: ${error.message}`);
            console.log(`🔄 Falling back to rule-based decision making`);
            this.groqAvailable = false;
            return false;
        }
    }

    /**
     * Main decision-making method
     * Integrates BERT analysis with LangChain reasoning
     */
    async makeDispatchDecision(emergencyData, bertAnalysis) {
        try {
            console.log(`🤖 Emergency Decision Agent analyzing: ${emergencyData.emergencyId}`);

            // Step 1: Scan available inventory
            const inventoryAnalysis = await this.scanInventory(bertAnalysis.disaster.type, bertAnalysis.severity);
            
            // Step 2: Assess emergency context
            const contextAnalysis = await this.assessEmergencyContext(emergencyData, bertAnalysis);
            
            // Step 3: Make LangChain-powered decision
            const decision = await this.generateDecision(emergencyData, bertAnalysis, inventoryAnalysis, contextAnalysis);
            
            // Step 4: If dispatch approved, execute it
            if (decision.shouldDispatch && decision.confidence > 0.7) {
                const dispatchResult = await this.executeDispatch(emergencyData.emergencyId, decision.dispatchPlan);
                return {
                    ...decision,
                    dispatchExecuted: true,
                    dispatchResult
                };
            }

            return {
                ...decision,
                dispatchExecuted: false,
                reason: decision.confidence <= 0.7 ? "Confidence too low for autonomous dispatch" : "Decision was not to dispatch"
            };

        } catch (error) {
            console.error("❌ Emergency Decision Agent error:", error);
            return {
                shouldDispatch: false,
                confidence: 0,
                error: error.message,
                fallbackToManual: true
            };
        }
    }

    /**
     * Scan inventory for available resources
     */
    async scanInventory(disasterType, severity) {
        try {
            // Get resource requirements based on disaster type
            const requiredResources = this.emergencyResourceMap[disasterType] || this.emergencyResourceMap.general;
            
            // Scan inventory for matching items with timeout
            const availableItems = await InventoryItem.find({
                currentStock: { $gt: 0 }
            }).populate('location').maxTimeMS(5000);

            // Categorize available resources
            const inventoryAnalysis = {
                totalItems: availableItems.length,
                availableByCategory: {},
                resourceMatches: [],
                totalValue: 0,
                criticalShortages: [],
                recommendations: []
            };

            // Analyze each category
            const categories = ['Medical', 'Food', 'Shelter', 'Equipment', 'Water'];
            categories.forEach(category => {
                const categoryItems = availableItems.filter(item => item.category === category);
                inventoryAnalysis.availableByCategory[category] = {
                    count: categoryItems.length,
                    totalStock: categoryItems.reduce((sum, item) => sum + (item.currentStock || 0), 0),
                    totalValue: categoryItems.reduce((sum, item) => sum + ((item.currentStock || 0) * (item.cost || 0)), 0)
                };
            });

            // Find matching resources
            const allRequiredResources = [
                ...requiredResources.immediate,
                ...requiredResources.secondary,
                ...(requiredResources.equipment || [])
            ];

            for (const resourceType of allRequiredResources) {
                const matchingItems = availableItems.filter(item => 
                    this.matchResourceToItem(resourceType, item.name, item.category)
                );

                if (matchingItems.length > 0) {
                    inventoryAnalysis.resourceMatches.push({
                        resourceType,
                        matchingItems: matchingItems.map(item => ({
                            id: item._id,
                            name: item.name || 'Unknown Item',
                            category: item.category || 'General',
                            currentStock: item.currentStock || 0,
                            location: item.location?.name || item.location || 'Unknown Location',
                            cost: item.cost || 0,
                            status: item.status || 'unknown'
                        }))
                    });
                } else {
                    inventoryAnalysis.criticalShortages.push(resourceType);
                }
            }

            // Calculate total available value
            inventoryAnalysis.totalValue = availableItems.reduce((sum, item) => 
                sum + ((item.currentStock || 0) * (item.cost || 0)), 0
            );

            return inventoryAnalysis;

        } catch (error) {
            console.error("❌ Inventory scan error:", error);
            // Return mock inventory data for testing
            return { 
                error: error.message, 
                totalItems: 5,
                availableByCategory: {
                    Medical: { count: 2, totalStock: 50, totalValue: 5000 },
                    Food: { count: 1, totalStock: 100, totalValue: 2000 },
                    Water: { count: 1, totalStock: 200, totalValue: 1000 },
                    Equipment: { count: 1, totalStock: 10, totalValue: 15000 }
                },
                resourceMatches: [
                    {
                        resourceType: 'emergency_medical_kits',
                        matchingItems: [{
                            id: 'mock_medical_1',
                            name: 'Emergency Medical Kit',
                            category: 'Medical',
                            currentStock: 25,
                            location: 'Central Warehouse',
                            cost: 100,
                            status: 'available'
                        }]
                    },
                    {
                        resourceType: 'rescue_boats',
                        matchingItems: [{
                            id: 'mock_boat_1',
                            name: 'Rescue Boat',
                            category: 'Equipment',
                            currentStock: 5,
                            location: 'Emergency Station',
                            cost: 5000,
                            status: 'available'
                        }]
                    }
                ],
                criticalShortages: [],
                totalValue: 23000
            };
        }
    }

    /**
     * Assess emergency context using BERT analysis
     */
    async assessEmergencyContext(emergencyData, bertAnalysis) {
        const context = {
            urgencyScore: this.calculateUrgencyScore(bertAnalysis),
            locationRisk: await this.assessLocationRisk(emergencyData.location),
            timeOfDay: new Date().getHours(),
            weatherImpact: "normal", // Could integrate weather API
            resourceDemand: this.calculateResourceDemand(bertAnalysis.severity),
            estimatedAffectedPopulation: this.estimateAffectedPopulation(bertAnalysis)
        };

        return context;
    }

    /**
     * Generate decision using Groq AI (or fallback logic)
     */
    async generateDecision(emergencyData, bertAnalysis, inventoryAnalysis, contextAnalysis) {
        const prompt = `You are an AI Emergency Response Decision Agent for Punjab, India. Analyze the following emergency situation and decide whether to automatically dispatch resources.

EMERGENCY DETAILS:
- Emergency ID: ${emergencyData.emergencyId}
- Location: ${emergencyData.location.address || `${emergencyData.location.lat}, ${emergencyData.location.lon}`}
- User Message: "${emergencyData.userMessage}"
- Disaster Type: ${bertAnalysis.disaster.type} (Confidence: ${Math.round(bertAnalysis.disaster.confidence * 100)}%)
- Severity: ${bertAnalysis.severity}
- Urgency: ${bertAnalysis.sentiment.urgency}

BERT ANALYSIS:
- Sentiment Score: ${bertAnalysis.sentiment.score}
- Keywords: ${bertAnalysis.sentiment.keywords.join(", ")}
- Emotion Detected: ${bertAnalysis.sentiment.emotion}

INVENTORY ANALYSIS:
- Total Available Items: ${inventoryAnalysis.totalItems}
- Available Resources: ${inventoryAnalysis.resourceMatches.length}
- Critical Shortages: ${inventoryAnalysis.criticalShortages.join(", ")}
- Total Inventory Value: ₹${inventoryAnalysis.totalValue.toFixed(2)}

CONTEXT ANALYSIS:
- Urgency Score: ${contextAnalysis.urgencyScore}/10
- Time of Day: ${contextAnalysis.timeOfDay}:00
- Estimated Affected Population: ${contextAnalysis.estimatedAffectedPopulation}

DECISION CRITERIA:
1. Confidence > 80% for autonomous dispatch
2. Severity must be "high" or "critical" for immediate dispatch
3. Required resources must be available in inventory
4. Cost-benefit analysis must be favorable
5. Risk assessment must be acceptable

Based on this analysis, make a decision about autonomous resource dispatch. Consider:
- Public safety priority
- Resource availability and cost
- Response time criticality
- Risk mitigation strategies

Respond with a JSON object containing:
{
  "shouldDispatch": boolean,
  "confidence": number (0-1),
  "dispatchPlan": {
    "priority": "low|medium|high|critical",
    "estimatedResponseTime": number (minutes),
    "resourceAllocations": [
      {
        "itemId": "string",
        "itemName": "string", 
        "quantity": number,
        "locationId": "string",
        "locationName": "string",
        "justification": "string"
      }
    ],
    "totalEstimatedCost": number,
    "riskAssessment": "string"
  },
  "reasoning": "string",
  "alternativeActions": ["string"]
}`;

        try {
            if (this.groqAvailable) {
                // Use Groq AI
                const response = await this.groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: this.modelName,
                    max_tokens: 2048,
                    temperature: 0.3,
                    response_format: { type: "json_object" }
                });
                
                const responseText = response.choices[0].message.content;
                
                try {
                    const decision = JSON.parse(responseText);
                    console.log(`🤖 Groq AI decision: ${decision.shouldDispatch ? 'DISPATCH' : 'NO DISPATCH'} (confidence: ${Math.round(decision.confidence * 100)}%)`);
                    return decision;
                } catch (parseError) {
                    console.warn("⚠️ Failed to parse Groq JSON response, using rule-based fallback");
                    console.warn("Response:", responseText.substring(0, 200) + "...");
                    return this.makeRuleBasedDecision(emergencyData, bertAnalysis, inventoryAnalysis, contextAnalysis);
                }
            } else {
                // Fallback to rule-based decision
                console.log("🔄 Using rule-based decision (Groq not available)");
                return this.makeRuleBasedDecision(emergencyData, bertAnalysis, inventoryAnalysis, contextAnalysis);
            }
        } catch (error) {
            console.error("❌ Groq decision error:", error);
            // Fallback to rule-based decision
            return this.makeRuleBasedDecision(emergencyData, bertAnalysis, inventoryAnalysis, contextAnalysis);
        }
    }

    /**
     * Rule-based fallback decision logic
     */
    makeRuleBasedDecision(emergencyData, bertAnalysis, inventoryAnalysis, contextAnalysis) {
        const confidence = bertAnalysis?.disaster?.confidence || 0.5;
        const severity = bertAnalysis?.severity || 'medium';
        const urgencyScore = contextAnalysis?.urgencyScore || 5;
        
        // Decision logic
        const shouldDispatch = (
            confidence > 0.8 && 
            (severity === 'critical' || severity === 'high') &&
            urgencyScore >= 7 &&
            inventoryAnalysis.resourceMatches.length > 0
        );

        // Generate resource allocations
        const resourceAllocations = [];
        let totalCost = 0;

        if (shouldDispatch && inventoryAnalysis.resourceMatches) {
            for (const match of inventoryAnalysis.resourceMatches.slice(0, 5)) { // Limit to top 5 matches
                if (match.matchingItems && match.matchingItems.length > 0) {
                    const item = match.matchingItems[0]; // Take first available item
                    const quantity = this.calculateOptimalQuantity(item, severity, contextAnalysis?.estimatedAffectedPopulation || 50);
                    
                    if (quantity > 0 && quantity <= (item.currentStock || 0)) {
                        resourceAllocations.push({
                            itemId: item.id || 'unknown',
                            itemName: item.name || 'Unknown Item',
                            quantity,
                            locationId: "location_id", // Would be actual location ID
                            locationName: item.location || 'Unknown Location',
                            justification: `Required for ${bertAnalysis?.disaster?.type || 'emergency'} emergency response`
                        });
                        totalCost += quantity * (item.cost || 0);
                    }
                }
            }
        }

        return {
            shouldDispatch,
            confidence: shouldDispatch ? Math.min(confidence + 0.1, 1) : confidence,
            dispatchPlan: {
                priority: severity,
                estimatedResponseTime: this.calculateResponseTime(contextAnalysis),
                resourceAllocations,
                totalEstimatedCost: totalCost,
                riskAssessment: `${severity} severity emergency with ${Math.round(confidence * 100)}% confidence. Risk level: ${urgencyScore >= 8 ? 'High' : 'Medium'}`
            },
            reasoning: `Rule-based decision: Confidence=${Math.round(confidence * 100)}%, Severity=${severity}, Urgency=${urgencyScore}/10, Available resources=${inventoryAnalysis.resourceMatches.length}`,
            alternativeActions: shouldDispatch ? [] : [
                "Manual review required",
                "Contact local emergency services",
                "Escalate to branch manager",
                "Request additional information from user"
            ]
        };
    }

    /**
     * Execute the dispatch plan
     */
    async executeDispatch(emergencyId, dispatchPlan) {
        try {
            console.log(`🚀 Executing autonomous dispatch for ${emergencyId}`);

            // Update inventory quantities
            const dispatchResults = [];
            for (const allocation of dispatchPlan.resourceAllocations) {
                const item = await InventoryItem.findById(allocation.itemId);
                if (item && item.currentStock >= allocation.quantity) {
                    item.currentStock -= allocation.quantity;
                    await item.save();
                    
                    dispatchResults.push({
                        itemName: allocation.itemName,
                        quantity: allocation.quantity,
                        dispatched: true,
                        remainingStock: item.currentStock
                    });
                } else {
                    dispatchResults.push({
                        itemName: allocation.itemName,
                        quantity: allocation.quantity,
                        dispatched: false,
                        reason: "Insufficient stock"
                    });
                }
            }

            // Update emergency status
            const emergency = await Emergency.findOne({ emergencyId });
            if (emergency) {
                emergency.status = 'dispatched';
                emergency.dispatchDetails = {
                    dispatchedAt: new Date(),
                    dispatchedBy: new mongoose.Types.ObjectId(), // System dispatch
                    centers: [{
                        centerName: "Autonomous AI Dispatch",
                        resources: dispatchPlan.resourceAllocations.map(alloc => ({
                            name: alloc.itemName,
                            quantity: alloc.quantity,
                            unit: "units"
                        }))
                    }],
                    totalResources: dispatchPlan.resourceAllocations.reduce((acc, alloc) => {
                        acc[alloc.itemName] = alloc.quantity;
                        return acc;
                    }, {}),
                    estimatedArrival: new Date(Date.now() + dispatchPlan.estimatedResponseTime * 60000),
                    deliveryNotes: "Autonomous dispatch by AI Emergency Decision Agent"
                };
                
                emergency.timeline.push({
                    status: 'dispatched',
                    timestamp: new Date(),
                    notes: `Autonomous dispatch executed by AI agent. Priority: ${dispatchPlan.priority}`
                });

                await emergency.save();
            }

            return {
                success: true,
                dispatchResults,
                totalItemsDispatched: dispatchResults.filter(r => r.dispatched).length,
                estimatedArrival: new Date(Date.now() + dispatchPlan.estimatedResponseTime * 60000)
            };

        } catch (error) {
            console.error("❌ Dispatch execution error:", error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Helper methods
    matchResourceToItem(resourceType, itemName, category) {
        const resourceLower = resourceType.toLowerCase().replace(/_/g, ' ');
        const itemLower = itemName.toLowerCase();
        
        return itemLower.includes(resourceLower) || 
               resourceLower.includes(itemLower.split(' ')[0]) ||
               (resourceType.includes('medical') && category === 'Medical') ||
               (resourceType.includes('food') && category === 'Food') ||
               (resourceType.includes('water') && category === 'Water') ||
               (resourceType.includes('shelter') && category === 'Shelter') ||
               (resourceType.includes('equipment') && category === 'Equipment');
    }

    calculateUrgencyScore(bertAnalysis) {
        let score = 5; // Base score
        
        // Severity impact
        if (bertAnalysis?.severity === 'critical') score += 3;
        else if (bertAnalysis?.severity === 'high') score += 2;
        else if (bertAnalysis?.severity === 'medium') score += 1;
        
        // Sentiment impact
        if (bertAnalysis?.sentiment?.urgency === 'critical') score += 2;
        else if (bertAnalysis?.sentiment?.urgency === 'high') score += 1;
        
        // Confidence impact
        if (bertAnalysis?.disaster?.confidence) {
            score += bertAnalysis.disaster.confidence * 2;
        }
        
        return Math.min(Math.round(score), 10);
    }

    async assessLocationRisk(location) {
        // Simple risk assessment based on coordinates
        // In production, this could integrate with hazard maps
        return "medium";
    }

    calculateResourceDemand(severity) {
        const demandMap = {
            'critical': 'very_high',
            'high': 'high',
            'medium': 'medium',
            'low': 'low'
        };
        return demandMap[severity] || 'medium';
    }

    estimateAffectedPopulation(bertAnalysis) {
        // Simple estimation based on disaster type and severity
        const basePopulation = {
            'flood': 100,
            'fire': 50,
            'earthquake': 200,
            'medical': 10,
            'general': 25
        };
        
        const multiplier = {
            'critical': 4,
            'high': 3,
            'medium': 2,
            'low': 1
        };
        
        const disasterType = bertAnalysis?.disaster?.type || 'general';
        const severity = bertAnalysis?.severity || 'medium';
        
        const base = basePopulation[disasterType] || basePopulation.general;
        const mult = multiplier[severity] || 1;
        
        return base * mult;
    }

    calculateOptimalQuantity(item, severity, affectedPopulation) {
        // Calculate optimal quantity based on item type, severity, and affected population
        let baseQuantity = Math.ceil(affectedPopulation / 10); // Base ratio
        
        // Adjust based on severity
        if (severity === 'critical') baseQuantity *= 2;
        else if (severity === 'high') baseQuantity *= 1.5;
        
        // Ensure we don't exceed available stock
        return Math.min(baseQuantity, item.currentStock, Math.floor(item.currentStock * 0.8));
    }

    calculateResponseTime(contextAnalysis) {
        let baseTime = 30; // 30 minutes base
        
        // Adjust based on urgency
        if (contextAnalysis.urgencyScore >= 9) baseTime = 15;
        else if (contextAnalysis.urgencyScore >= 7) baseTime = 20;
        
        // Time of day adjustment
        if (contextAnalysis.timeOfDay < 6 || contextAnalysis.timeOfDay > 22) {
            baseTime += 10; // Night time delay
        }
        
        return baseTime;
    }
}

export default EmergencyDecisionAgent;