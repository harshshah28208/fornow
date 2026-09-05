# DealFlow360 - An Intelligent, Self-Governing Sales Operations Platform

> **Hackathon Problem Statement & Project Documentation**  
> **Excalidraw Mockup Link:** [DealFlow360 Mockups](https://app.excalidraw.com/l/65VNwvy7c4X/7Fb5SR3WKu2)

---

## 1. Project Overview

Most simple sales tools handle the basics well: create a quote, confirm an order, invoice it. Real B2B sales teams operate in messier conditions such as multi-level discount approvals, partial stock spread across warehouses, bundled subscriptions mixed with one-time hardware, customers who want to negotiate inside a portal instead of over email, and managers who only find out a deal is stuck after it has already lost momentum.

The goal of **DealFlow360** is to build a sales platform that goes beyond a standard quote-to-invoice form and becomes a **self-governing deal engine**—one that enforces pricing discipline, reacts to inventory reality in real time, keeps subscriptions and one-time sales reconciled on a single order, and gives both sales reps and customers a living, negotiable document instead of a static PDF.

### Key Capabilities
- **Multi-tier discount governance and automated approval routing**
- **Live upsell and cross-sell recommendations** while building a quotation with real-time margin impact
- **Multi-warehouse fulfillment splitting and backorder handling**
- **Hybrid billing** (one-time products mixed with recurring subscription lines)
- **Deal health monitoring and anomaly alerts**
- **Customer-facing portal negotiation** on live quotations
- **Sales backend configuration and reporting dashboards**

---

## 2. Goals & Scope

### Main Goal
Build a complete sales flow including backend configuration and a frontend quotation-to-cash experience.

### Key Outcomes
1. **Sales Rep Workflow:** Log in, build a quotation, and have it auto-route for the correct approval based on discount and customer tier.
2. **Live Upsell / Cross-Sell:** Rep receives recommendations with real-time margin calculation while building quotes.
3. **Smart Fulfillment:** Order automatically splits across warehouses based on live inventory availability (with manual override).
4. **Hybrid Billing Engine:** Single order mixes one-time products & recurring subscription lines with proper proration and billing schedules.
5. **Deal Health Dashboard:** Displays stalled quotes, discount anomalies, and delivery promise slippage in real time.
6. **Customer Portal:** Customer views, requests line-level adjustments, and negotiates terms directly without endless email threads.

---

## 3. User Roles

| Role | Responsibilities |
|---|---|
| **Sales Rep** | Builds quotes, applies discounts, reviews upsells, tracks approval & fulfillment, responds to customer negotiation. |
| **Sales Manager / Approver** | Reviews/approves/rejects quotes exceeding tier ceilings, configures discount rules & approval chains, monitors stalled deals. |
| **Finance / Operations User** | Second-level approvals for high-risk discounts, manages warehouse splits & backorders, reconciles recurring billing/credits. |
| **Customer (Portal User)** | Views quote online via magic link / login, proposes counter-discounts, adds line-level notes, confirms terms. |
| **Admin** | Manages system setup (products, price lists, discount tiers, warehouses, subscription plans) and platform analytics. |

---

## 4. Modules & Features Breakdown

### A) Sales Backend (Configuration Area)
1. **Authentication (Login / Signup):** Standard credentials for internal users; magic link / credentials for customer portal.
2. **Product & Price List Management:**
   - General Info: Name, Category, Price, Unit, Tax, Description.
   - Variants: Attributes (Size, Pack), values, price adjustments.
   - Price Lists: Tier-based customer pricing (Bronze, Silver, Gold), currency rules.
3. **Discount Tier & Approval Chain Setup:**
   - Tier ceilings (e.g. Bronze ≤ 5%, Silver ≤ 10%, Gold ≤ 15%).
   - Category-specific ceilings (e.g. Hardware up to 15%, Services max 10%).
   - Multi-level chain (Sales Manager vs. Finance).
   - Blended risk score calculation and audit logging (user, timestamp, reason).
4. **Warehouse & Fulfillment Setup:**
   - Multi-warehouse configuration (e.g. Main Warehouse, East Depot).
   - Stock levels, replenishment rules, shipping cost weighting for auto-split minimization.
5. **Subscription / Recurring Plan Setup:**
   - Billing frequencies (monthly, quarterly, yearly).
   - Mid-cycle proration rules for quantity/plan adjustments.
   - Cancellation and credit note / partial refund triggers.
6. **Upsell / Cross-Sell Rules (Optional):**
   - Co-purchase pairing rules, promotional ranking tags, margin thresholds.
7. **Reporting & Dashboards:**
   - Performance metrics, filtering (Period, Rep/Team, Status, Category), PDF/XLS export.

---

### B) Sales Frontend (Rep Workspace Experience)
1. **Workspace Navigation & Pipeline:**
   - Top menu: Quotations list, Kanban pipeline view, Reload Data, Backend Settings.
2. **Quotation Builder (Products + Cart):**
   - Pick products across Hardware, Services, and Subscriptions.
   - Adjust quantities, apply line/order discounts, live margin indicator.
   - Route to approval or straight to fulfillment.
3. **Discount Approval Flow:**
   - Blended risk score display and multi-tier approval step checklist.
   - Action controls: Approve, Reject, Return for Revision with audit trail.
4. **Upsell / Cross-Sell Panel:**
   - Ranked suggestions with immediate margin delta preview and one-click "Add to Quote".
5. **Fulfillment & Warehouse Split Screen:**
   - Recommended split based on real-time inventory, shipment count & cost estimates.
   - Manual override & "Consolidate Remaining Backorder" prompt if stock arrives mid-fulfillment.
6. **Subscription & Billing Screen:**
   - Distinct breakdown of one-time lines vs recurring billing schedule.
   - Proration calculations and cancellation/credit note management.
7. **Customer Portal Negotiation Screen (Separate View):**
   - Status tracking (`Sent`, `Under Negotiation`, `Confirmed`).
   - Line-level comments, counter-discount proposals, and one-click confirmation.
   - Auto-triggers re-approval if counter-terms exceed thresholds.
8. **Deal Health & Anomaly Dashboard:**
   - Stalled deal alerts (inactive > X days), discount anomaly detection, delivery slippage warnings.
   - Direct quote navigation and automated nudge / escalation actions.

---

## 5. Understanding the Blended Discount Risk Score

The blended discount risk score decides whether a quotation needs Manager approval or Finance approval:
- **Line-level Discipline:** Each item category has its own ceiling (e.g., Gold customer allows 15% on Hardware, but only 10% on Services).
- **Cumulative Margin Protection:** Small violations spread across multiple lines (e.g., 2% over on line 1, 3% over on line 2) are aggregated into a blended risk score so rep margin erosion does not slip through undetected.

---

## 6. End-to-End Test Walkthrough (Quick Test Flow)

1. **Setup:** Log in and configure backend data (Discount tiers, Warehouses, Subscription plans).
2. **Quote Creation:** Create a quote with a product line exceeding normal discount limits.
3. **Auto-Route:** Confirm quote triggers automatic manager approval routing without manual rep input.
4. **Upsell:** Accept an upsell suggestion and verify immediate margin and total recalculation.
5. **Approval & Split:** Approve quotation, verify stock auto-splits across multiple warehouses based on inventory.
6. **Hybrid Billing:** Verify one-time items and recurring subscription lines generate distinct and correct billing schedules.
7. **Portal Negotiation:** Open customer portal, counter with a higher discount, and confirm the quote automatically re-enters approval.
8. **Order Confirmation & Payment:** Confirm order, record payment, and verify invoice status updates correctly.

---

## 7. Deliverables Checklist
- [ ] Working application (backend + frontend) with sample seed data
- [ ] 5-minute live demo covering quotation-to-fulfillment / billing end-to-end flows
- [ ] Architecture diagram showing data models & module connections
- [ ] Next steps roadmap & future enhancement note
