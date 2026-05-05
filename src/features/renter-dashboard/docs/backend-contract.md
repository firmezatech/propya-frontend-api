# Renter dashboard backend contract

This dashboard must be filled by the backend with a single tenant-focused payload. The frontend should only render the view, animate percentages and handle navigation. Business rules such as rent reduction, token ownership, invoice totals and milestone calculations should be resolved by the backend whenever possible.

## Recommended endpoint

```http
GET /tenant/dashboard
Authorization: Bearer <token>
```

The backend should identify the authenticated tenant from the token/session. The frontend should not send arbitrary `userId` values for this screen.

## Response shape

```json
{
  "hasDashboardData": true,
  "tenant": {
    "id": "uuid",
    "firstName": "Diana",
    "fullName": "Diana Aguilar"
  },
  "referenceMonth": {
    "label": "Dezembro 2025",
    "year": 2025,
    "month": 12
  },
  "property": {
    "id": "uuid-or-number",
    "name": "Casa Propya",
    "totalValue": 160000,
    "totalValueFormatted": "R$ 160.000,00"
  },
  "ownership": {
    "percentage": 7.2,
    "percentageLabel": "7,2%",
    "acquiredTokensValue": 11500,
    "acquiredTokensValueLabel": "R$ 11.500,00",
    "remainingToOwnValue": 148500,
    "remainingToOwnValueLabel": "R$ 148.500,00"
  },
  "rent": {
    "originalValue": 854,
    "originalValueLabel": "R$ 854,00",
    "currentValue": 792.62,
    "currentValueLabel": "R$ 792,62",
    "monthlySavings": 61.38,
    "monthlySavingsLabel": "R$ 61,38",
    "yearlySavings": 736.56,
    "yearlySavingsLabel": "R$ 736,56"
  },
  "nextMilestone": {
    "percentage": 10,
    "percentageLabel": "10%",
    "remainingValue": 3500,
    "remainingValueLabel": "R$ 3.500,00",
    "progressPercentage": 76.6,
    "estimatedMonthlyRentReduction": 85,
    "estimatedMonthlyRentReductionLabel": "R$ 85,00"
  },
  "invoice": {
    "id": "uuid-or-number",
    "totalValue": 2353.76,
    "totalValueLabel": "R$ 2.353,76",
    "dueDate": "2025-12-20",
    "dueDateLabel": "20/12/2025",
    "status": "open",
    "paymentUrl": "https://...",
    "lines": [
      { "key": "discounted_rent", "label": "Aluguel com desconto", "value": 792.62, "valueLabel": "R$ 792,62", "tone": "success" },
      { "key": "rent_admin_fee", "label": "Taxa Adm Aluguel", "value": 6.14, "valueLabel": "R$ 6,14", "tone": "default" },
      { "key": "condominium", "label": "Condomínio", "value": 480, "valueLabel": "R$ 480,00", "tone": "default" },
      { "key": "scheduled_token_purchase", "label": "Compra programada de tokens", "value": 1000, "valueLabel": "R$ 1.000,00", "tone": "warning" },
      { "key": "token_purchase_fee", "label": "Taxa de compra de tokens", "value": 75, "valueLabel": "R$ 75,00", "tone": "default" }
    ]
  },
  "actions": {
    "buyTokensPath": "/connected/tokensToPurchasePix",
    "paymentHistoryPath": "/connected/recordsMenu?target=history"
  }
}
```

## Empty state

When the tenant does not have enough data for the board, return:

```json
{
  "hasDashboardData": false,
  "reason": "INCOMPLETE_REGISTRATION"
}
```

The frontend should then render the existing animated empty home screen that asks the tenant to complete registration.

## Frontend responsibilities

- Render the dashboard payload.
- Animate gauge, timeline and progress bars.
- Navigate to buy tokens, pay invoice and payment history.
- Show the existing empty onboarding screen when `hasDashboardData` is false.

## Backend responsibilities

- Determine if the tenant has enough data to see the board.
- Calculate ownership percentage, rent reduction, invoice total and next milestone.
- Return formatted labels and raw numeric values.
- Keep authorization rules server-side.
- Never require the frontend to infer financial rules from unrelated fields.

## Current adapter

The current frontend still receives data from the existing `getPropertyDetail`, `getRentDetail` and `getInvoiceOrRentDetail` calls. The renter dashboard module maps those legacy payloads to the view model in:

```txt
src/features/renter-dashboard/domain/fmz-renter-dashboard-view-model.ts
```

When the backend exposes `GET /tenant/dashboard`, replace that mapper with a thin API client and keep the React components unchanged.
