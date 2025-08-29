# RANKING CRITERIA AND DECIDING FACTORS
## 301st RRIBN Promotion Algorithm
### Based on Executive Order No. 212 (1939)

---

## SCORING MATRIX TABLE

| **Criteria Category** | **Weight** | **EO 212 Reference** | **Scoring Components** | **Maximum Points** | **Calculation Method** |
|----------------------|------------|---------------------|----------------------|-------------------|----------------------|
| **SENIORITY** | **30%** | Article I: "seniority in grade shall be established according to the total length of active service" | • Total Active Service<br/>• Commission Date<br/>• Continuous Service Record<br/>• Service Progression | 100 | `min(90 × (service_months/240) + 10 × service_ratio, 100)` |
| **PERFORMANCE** | **25%** | Article II: "satisfactory completion of efficiency report" | • Efficiency Rating (1-5 scale)<br/>• Performance Score (0-100)<br/>• Commendations & Awards<br/>• Leadership Roles | 100 | `min(base_score + efficiency_bonus + commendation_bonus + leadership_bonus, 100)` |
| **TIME-IN-GRADE** | **20%** | Article II: "must have served a minimum time in grade" | • Minimum Service Requirements<br/>• Additional Time Beyond Minimum<br/>• Rank Progression Readiness | 100 | `60 + min(months_over_minimum × 2, 40)` if minimum met, else `0` |
| **EDUCATION** | **15%** | Article II: "certificate of capacity for the next higher grade" | • Required Certificates (50%)<br/>• Correspondence Courses (30%)<br/>• Additional Training (20%) | 100 | `certificate_score + min(courses × 15, 30) + min(training × 2, 20)` |
| **TRAINING** | **10%** | Article II: "at least twenty-one days' active duty training" | • Minimum 21 Days Met (70%)<br/>• Additional Training Days (30%)<br/>• Specialized Training | 100 | `70 + min(additional_days × 0.5, 30)` if 21+ days, else `0` |

---

## DETAILED SCORING BREAKDOWN

### 1. SENIORITY SCORING (30% Weight)

| **Component** | **Sub-Weight** | **Scoring Logic** | **EO 212 Basis** |
|---------------|----------------|------------------|------------------|
| **Total Active Service** | 80% | Linear scale: 0-20 years = 0-72 points | "total length of active service therein" |
| **Continuous Service Bonus** | 20% | Up to 18 points for uninterrupted service | "shall establish permanently the relative seniority" |
| **Early Commission Bonus** | 10% | Up to 10 points for leadership potential | "Regular officers shall take precedence" |

**Calculation Formula:**
```typescript
const serviceRatio = min(totalServiceMonths / 240, 1);
const baseScore = serviceRatio * 90;
const continuousBonus = serviceRatio * 10;
return min(baseScore + continuousBonus, 100);
```

### 2. PERFORMANCE SCORING (25% Weight)

| **Component** | **Sub-Weight** | **Point Range** | **Criteria** |
|---------------|----------------|----------------|--------------|
| **Base Performance Score** | 60% | 0-100 | Current performance evaluations |
| **Efficiency Rating Bonus** | 25% | 0-20 | (Rating - 1) × 5 points |
| **Commendations Bonus** | 10% | 0-10 | 2 points per commendation (max 5) |
| **Leadership Roles Bonus** | 5% | 0-10 | 3 points per role (max 3 roles) |

**Efficiency Rating Scale:**
- **5 (Outstanding):** +20 points
- **4 (Excellent):** +15 points  
- **3 (Satisfactory):** +10 points
- **2 (Needs Improvement):** +5 points
- **1 (Unsatisfactory):** +0 points

### 3. TIME-IN-GRADE SCORING (20% Weight)

| **Current Rank** | **Minimum Months Required** | **EO 212 Reference** | **Scoring Logic** |
|------------------|---------------------------|---------------------|------------------|
| Third Lieutenant | 24 months (2 years) | Article II requirements | Base 60% if minimum met |
| Second Lieutenant | 36 months (3 years) | Article II requirements | +2% per additional month |
| First Lieutenant | 48 months (4 years) | Article II requirements | Maximum 100% total |
| Captain | 60 months (5 years) | Article II requirements | 0% if minimum not met |
| Major | 72 months (6 years) | Article II requirements | |
| Lieutenant Colonel | 84 months (7 years) | Article II requirements | |

**Calculation Example:**
- **Captain with 72 months in grade** (minimum 60):
  - Base score: 60%
  - Bonus: (72-60) × 2 = 24%
  - **Total: 84%**

### 4. EDUCATION SCORING (15% Weight)

| **Component** | **Sub-Weight** | **Requirements** | **EO 212 Basis** |
|---------------|----------------|----------------|------------------|
| **Required Certificates** | 50% | Must have certificate of capacity | "certificate of capacity for the next higher grade" |
| **Correspondence Courses** | 30% | Prescribed courses completed | "prescribed correspondence courses" |
| **Additional Training** | 20% | Professional development | Supporting career advancement |

**Education Component Breakdown:**
- **Certificate Present:** 50 points
- **Each Correspondence Course:** 15 points (max 30)
- **Each Additional Training:** 2 points (max 20)

### 5. TRAINING SCORING (10% Weight)

| **Requirement** | **Point Value** | **EO 212 Reference** |
|----------------|----------------|---------------------|
| **Minimum 21 Days Active Duty** | 70 points | "at least twenty-one days' active duty training" |
| **Additional Training Days** | 0.5 points per day (max 30) | Supporting professional development |
| **Specialized Training** | Bonus consideration | Enhanced capability |

---

## PROMOTION THRESHOLDS AND RECOMMENDATIONS

| **Score Range** | **Classification** | **Recommendation** | **Action Required** |
|----------------|-------------------|-------------------|-------------------|
| **90-100%** | **IMMEDIATE PROMOTION** | Exceptional performance warrants immediate advancement | Fast-track processing |
| **80-89%** | **PRIORITY PROMOTION** | Fast-track to promotion board | Accelerated review |
| **70-79%** | **RECOMMENDED** | Schedule for promotion board review | Standard processing |
| **60-69%** | **ELIGIBLE** | Meets minimum requirements, pending evaluation | Board consideration |
| **Below 60%** | **NOT ELIGIBLE** | Additional development required | Development plan needed |

---

## DECIDING FACTORS AND TIE-BREAKING PROCEDURES

### Primary Ranking Order:
1. **Total Promotion Score** (highest first)
2. **Seniority Score** (most senior first) - *EO 212 principle*
3. **Time-in-Grade Score** (longest serving first)
4. **Performance Score** (highest performing first)
5. **Commission Date** (earliest first)

### Special Considerations:
- **Regular vs Reserve Officers:** Regular officers receive precedence per EO 212 Article I
- **Combat Experience:** Additional consideration for operational deployments
- **Critical Skills:** Bonus consideration for mission-essential capabilities
- **Leadership Potential:** Enhanced weighting for command positions

---

## QUALITY ASSURANCE AND VALIDATION

### Algorithm Validation Checks:
- ✅ **Weight Distribution:** All weights sum to 100%
- ✅ **Score Ranges:** All component scores between 0-100
- ✅ **Policy Compliance:** Each criterion maps to EO 212 requirement
- ✅ **Transparency:** All calculations are documented and auditable

### Audit Requirements:
- **Individual Score Breakdown:** Detailed calculation for each personnel
- **Policy Justification:** Reference to specific EO 212 requirements
- **Decision Trail:** Complete record of evaluation process
- **Human Review:** Command approval required for final decisions

---

## IMPLEMENTATION NOTES

### Technical Implementation:
- **Language:** TypeScript for algorithm logic
- **Data Sources:** Personnel records, training databases, performance evaluations
- **Output Format:** Structured JSON with audit trails
- **Integration:** Compatible with existing 301st RRIBN Management System

### Compliance Monitoring:
- **Regular Reviews:** Annual algorithm validation
- **Policy Updates:** Incorporation of new regulations
- **Performance Metrics:** Success rate tracking
- **Feedback Integration:** Continuous improvement process

---

*This ranking criteria table provides the detailed framework for transparent, policy-based promotion decisions within the 301st RRIBN Management System, ensuring compliance with Executive Order No. 212 (1939) while supporting modern military personnel management needs.*
