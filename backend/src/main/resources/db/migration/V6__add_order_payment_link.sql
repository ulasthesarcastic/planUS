-- Sipariş → PaymentItem bağlantısı (sourceOrderId ile tracability ve cascade)
ALTER TABLE payment_items ADD COLUMN IF NOT EXISTS source_order_id VARCHAR(255);

-- PotentialSale'e portföy kategorisi seçimi için categoryId
ALTER TABLE potential_sales ADD COLUMN IF NOT EXISTS category_id VARCHAR(255);
