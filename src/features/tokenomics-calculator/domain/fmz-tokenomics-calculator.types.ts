export type FmzTokenomicsParticipantRole = 'investor' | 'owner' | 'tenant';

export type FmzTokenomicsParticipantInput = {
  name: string;
  role: FmzTokenomicsParticipantRole;
  ownership_percent: number;
  tokens_purchased: number;
};

export type FmzTokenomicsDistributionPayload = {
  reference_month: string;
  property_value: number;
  rent_gross_amount: number;
  token_unit_value: number;
  charges_amount: number;
  extra_discounts_amount: number;
  fine_and_interest_amount: number;
  admin_fee_percent: number;
  token_admin_fee_percent: number;
  admin_fee_mode: 'deduct_from_distribution' | 'add_to_tenant_boleto';
  tenant_receives_cash_distribution: boolean;
  participants: FmzTokenomicsParticipantInput[];
};

export type FmzTokenomicsParticipantResult = {
  name: string;
  role: FmzTokenomicsParticipantRole | string;
  ownership_percent: string;
  tokens_purchased: string;
  gross_rent_share: string;
  admin_fee_share: string;
  token_admin_fee_share: string;
  net_amount_to_receive: string;
  tenant_discount_amount: string;
};

export type FmzTokenomicsDistributionResult = {
  reference_month: string;
  property_value: string;
  token_unit_value: string;
  total_tokens: string;
  rent_gross_amount: string;
  tenant_total_ownership_percent: string;
  tenant_discount_amount: string;
  rent_amount_after_tenant_discount: string;
  charges_amount: string;
  extra_discounts_amount: string;
  fine_and_interest_amount: string;
  rent_amount_to_pay: string;
  admin_fee_amount: string;
  token_admin_fee_amount: string;
  distributable_amount_after_admin_fees: string;
  total_recipients_net_amount: string;
  total_ownership_percent: string;
  ownership_validation_status: 'ok' | 'warning_below_100' | 'invalid_above_100' | string;
  participants: FmzTokenomicsParticipantResult[];
  warnings: string[];
};
