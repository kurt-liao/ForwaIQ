-- ============================================================================
-- ForwaIQ - 完整資料庫架構 V2
-- ============================================================================
-- 說明：此架構整合現有資料庫結構並針對 UI 需求優化
-- 執行：請在 Supabase SQL Editor 中執行此檔案
-- ============================================================================

-- ============================================================================
-- 1. 清理舊資料（可選）
-- ============================================================================
-- 如果需要重新建立，請取消註解以下行
-- DROP TABLE IF EXISTS quote_line_items CASCADE;
-- DROP TABLE IF EXISTS quotes CASCADE;
-- DROP TABLE IF EXISTS inquiries CASCADE;
-- DROP TABLE IF EXISTS vendor_contacts CASCADE;
-- DROP TABLE IF EXISTS vendors CASCADE;
-- DROP TABLE IF EXISTS custom_fields CASCADE;
-- DROP TABLE IF EXISTS fee_types CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TYPE IF EXISTS inquiry_status CASCADE;
-- DROP TYPE IF EXISTS user_role CASCADE;
-- DROP TYPE IF EXISTS vendor_type CASCADE;

-- ============================================================================
-- 2. 自定義類型 (ENUM)
-- ============================================================================

-- 供應商類型
CREATE TYPE vendor_type AS ENUM ('shipping', 'trucking', 'customs');

-- 詢價狀態
CREATE TYPE inquiry_status AS ENUM ('pending', 'quoted', 'accepted', 'rejected', 'cancelled');

-- 用戶角色
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'viewer');

-- ============================================================================
-- 3. 用戶表 (users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

COMMENT ON TABLE users IS '用戶資料表';
COMMENT ON COLUMN users.role IS '用戶角色：admin(管理員)、staff(員工)、viewer(訪客)';

-- ============================================================================
-- 4. 供應商表 (vendors)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendors (
    vendor_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type vendor_type NOT NULL,
    address TEXT,
    main_phone VARCHAR(50),
    rating DECIMAL(2,1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_vendors_type ON vendors(type);
CREATE INDEX IF NOT EXISTS idx_vendors_name ON vendors(name);
CREATE INDEX IF NOT EXISTS idx_vendors_active ON vendors(is_active);

COMMENT ON TABLE vendors IS '供應商資料表';
COMMENT ON COLUMN vendors.type IS '供應商類型：shipping(海運)、trucking(拖車)、customs(報關)';
COMMENT ON COLUMN vendors.rating IS '供應商評分 0.0-5.0';

-- ============================================================================
-- 5. 供應商聯絡人表 (vendor_contacts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS vendor_contacts (
    contact_id SERIAL PRIMARY KEY,
    vendor_id INTEGER NOT NULL REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_vendor_id ON vendor_contacts(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_contacts_primary ON vendor_contacts(vendor_id, is_primary);

COMMENT ON TABLE vendor_contacts IS '供應商聯絡人資料表';
COMMENT ON COLUMN vendor_contacts.is_primary IS '是否為主要聯絡人';

-- ============================================================================
-- 6. 費用類型表 (fee_types)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fee_types (
    fee_type_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_fee_types_active ON fee_types(is_active);
CREATE INDEX IF NOT EXISTS idx_fee_types_category ON fee_types(category);

COMMENT ON TABLE fee_types IS '費用類型主檔（如海運費、THC、報關費等）';

-- 預設費用類型
INSERT INTO fee_types (name, category, description) VALUES
('海運費', '海運', '基本海運運費'),
('THC', '海運', 'Terminal Handling Charge'),
('文件費', '海運', '文件處理費用'),
('拖車費', '拖車', '陸地運輸費用'),
('報關費', '報關', '進出口報關費用'),
('查驗費', '報關', '海關查驗費用')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 7. 詢價表 (inquiries)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inquiries (
    inquiry_id SERIAL PRIMARY KEY,
    inquiry_ref VARCHAR(50) UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users(user_id),
    status inquiry_status NOT NULL DEFAULT 'pending',
    
    -- 詢價基本資訊
    subject VARCHAR(500),
    vendor_type vendor_type,
    
    -- 海運相關
    origin_location VARCHAR(255),
    destination_location VARCHAR(255),
    container_size VARCHAR(50),
    cargo_type VARCHAR(255),
    
    -- 拖車相關
    pickup_location VARCHAR(255),
    delivery_location VARCHAR(255),
    
    -- 報關相關
    customs_type VARCHAR(100),
    product_category VARCHAR(255),
    
    -- 通用欄位
    quantity INTEGER,
    target_date DATE,
    details TEXT,
    
    -- 自定義欄位
    custom_fields JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_inquiries_user ON inquiries(user_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_vendor_type ON inquiries(vendor_type);
CREATE INDEX IF NOT EXISTS idx_inquiries_created ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_custom_fields ON inquiries USING GIN (custom_fields);

COMMENT ON TABLE inquiries IS '詢價記錄表';
COMMENT ON COLUMN inquiries.inquiry_ref IS '詢價單號（自動生成）';
COMMENT ON COLUMN inquiries.status IS '詢價狀態';

-- ============================================================================
-- 8. 報價表 (quotes)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quotes (
    quote_id SERIAL PRIMARY KEY,
    inquiry_id INTEGER REFERENCES inquiries(inquiry_id) ON DELETE CASCADE, -- 可選，允許直接創建報價
    vendor_id INTEGER NOT NULL REFERENCES vendors(vendor_id),
    
    -- 報價基本資訊
    vendor_name VARCHAR(255) NOT NULL,
    vendor_type vendor_type NOT NULL,
    total_cost_display DECIMAL(12,2),
    base_currency VARCHAR(10) DEFAULT 'TWD',
    
    -- 海運專用欄位
    origin VARCHAR(255),
    destination VARCHAR(255),
    carrier VARCHAR(255),
    transit_time VARCHAR(100),
    container_size VARCHAR(50),
    
    -- 拖車專用欄位
    pickup_location VARCHAR(255),
    delivery_location VARCHAR(255),
    truck_type VARCHAR(100),
    
    -- 報關專用欄位
    customs_type VARCHAR(100),
    product_category VARCHAR(255),
    
    -- 有效期與備註
    valid_until DATE,
    notes TEXT,
    
    -- 自定義欄位值
    custom_fields JSONB DEFAULT '{}',
    
    -- 時間戳記
    received_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引優化
CREATE INDEX IF NOT EXISTS idx_quotes_inquiry ON quotes(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_quotes_vendor ON quotes(vendor_id);
CREATE INDEX IF NOT EXISTS idx_quotes_vendor_type ON quotes(vendor_type);
CREATE INDEX IF NOT EXISTS idx_quotes_valid_until ON quotes(valid_until);
CREATE INDEX IF NOT EXISTS idx_quotes_total_cost ON quotes(total_cost_display);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at DESC);

-- 海運查詢優化
CREATE INDEX IF NOT EXISTS idx_quotes_shipping 
ON quotes(vendor_type, origin, destination, container_size) 
WHERE vendor_type = 'shipping';

-- 拖車查詢優化
CREATE INDEX IF NOT EXISTS idx_quotes_trucking 
ON quotes(vendor_type, pickup_location, delivery_location) 
WHERE vendor_type = 'trucking';

-- JSONB 自定義欄位索引
CREATE INDEX IF NOT EXISTS idx_quotes_custom_fields ON quotes USING GIN (custom_fields);

COMMENT ON TABLE quotes IS '報價資料表';
COMMENT ON COLUMN quotes.vendor_name IS '供應商名稱（冗余欄位，加速查詢）';
COMMENT ON COLUMN quotes.total_cost_display IS '總價（顯示用）';
COMMENT ON COLUMN quotes.custom_fields IS '自定義欄位的值，JSON 格式';

-- ============================================================================
-- 9. 報價明細表 (quote_line_items)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_line_items (
    item_id SERIAL PRIMARY KEY,
    quote_id INTEGER NOT NULL REFERENCES quotes(quote_id) ON DELETE CASCADE,
    fee_type_id INTEGER REFERENCES fee_types(fee_type_id),
    description_legacy VARCHAR(255),
    cost DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    remarks TEXT,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_quote_line_items_quote ON quote_line_items(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_fee_type ON quote_line_items(fee_type_id);
CREATE INDEX IF NOT EXISTS idx_quote_line_items_order ON quote_line_items(quote_id, display_order);

COMMENT ON TABLE quote_line_items IS '報價明細表（費用拆分）';
COMMENT ON COLUMN quote_line_items.description_legacy IS '舊版描述欄位（建議使用 fee_type_id）';

-- ============================================================================
-- 10. 自定義欄位表 (custom_fields)
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    field_type VARCHAR(20) NOT NULL 
        CHECK (field_type IN ('text', 'number', 'select', 'date', 'textarea')),
    vendor_type vendor_type NOT NULL,
    options JSONB DEFAULT '[]',
    is_required BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    
    UNIQUE(name, vendor_type)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_custom_fields_vendor_type ON custom_fields(vendor_type);
CREATE INDEX IF NOT EXISTS idx_custom_fields_order ON custom_fields(vendor_type, display_order);

COMMENT ON TABLE custom_fields IS '自定義欄位配置表';
COMMENT ON COLUMN custom_fields.field_type IS '欄位類型：text、number、select、date、textarea';
COMMENT ON COLUMN custom_fields.options IS '下拉選單選項（JSON 陣列）';

-- ============================================================================
-- 11. 詢價-供應商關聯表 (inquiry_vendors)
-- ============================================================================
CREATE TABLE IF NOT EXISTS inquiry_vendors (
    inquiry_id INTEGER REFERENCES inquiries(inquiry_id) ON DELETE CASCADE,
    vendor_id INTEGER REFERENCES vendors(vendor_id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    sent_status VARCHAR(20) DEFAULT 'pending' 
        CHECK (sent_status IN ('pending', 'sent', 'failed')),
    sent_at TIMESTAMP WITH TIME ZONE,
    
    PRIMARY KEY (inquiry_id, vendor_id)
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_inquiry_vendors_status ON inquiry_vendors(sent_status);
CREATE INDEX IF NOT EXISTS idx_inquiry_vendors_vendor ON inquiry_vendors(vendor_id);

COMMENT ON TABLE inquiry_vendors IS '詢價與供應商的關聯表（多對多）';

-- ============================================================================
-- 12. 觸發器函數 - 自動更新 updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 套用到所有需要的表格
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at
    BEFORE UPDATE ON vendors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_vendor_contacts_updated_at ON vendor_contacts;
CREATE TRIGGER update_vendor_contacts_updated_at
    BEFORE UPDATE ON vendor_contacts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_fee_types_updated_at ON fee_types;
CREATE TRIGGER update_fee_types_updated_at
    BEFORE UPDATE ON fee_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_inquiries_updated_at ON inquiries;
CREATE TRIGGER update_inquiries_updated_at
    BEFORE UPDATE ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quotes_updated_at ON quotes;
CREATE TRIGGER update_quotes_updated_at
    BEFORE UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_custom_fields_updated_at ON custom_fields;
CREATE TRIGGER update_custom_fields_updated_at
    BEFORE UPDATE ON custom_fields
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 13. 觸發器 - 自動生成詢價單號
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_inquiry_ref()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.inquiry_ref IS NULL THEN
        NEW.inquiry_ref := 'INQ' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEW.inquiry_id::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_inquiry_ref ON inquiries;
CREATE TRIGGER set_inquiry_ref
    BEFORE INSERT ON inquiries
    FOR EACH ROW
    EXECUTE FUNCTION generate_inquiry_ref();

-- ============================================================================
-- 14. 觸發器 - 自動設定報價的供應商名稱
-- ============================================================================
CREATE OR REPLACE FUNCTION set_vendor_name_on_quote()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.vendor_name IS NULL OR NEW.vendor_name = '' THEN
        SELECT name INTO NEW.vendor_name
        FROM vendors
        WHERE vendor_id = NEW.vendor_id;
    END IF;
    
    IF NEW.vendor_type IS NULL THEN
        SELECT type INTO NEW.vendor_type
        FROM vendors
        WHERE vendor_id = NEW.vendor_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_set_vendor_info ON quotes;
CREATE TRIGGER auto_set_vendor_info
    BEFORE INSERT OR UPDATE ON quotes
    FOR EACH ROW
    EXECUTE FUNCTION set_vendor_name_on_quote();

-- ============================================================================
-- 15. 視圖 (Views)
-- ============================================================================

-- 15.1 報價詳細資訊視圖
CREATE OR REPLACE VIEW quotes_with_details AS
SELECT 
    q.*,
    v.name as vendor_full_name,
    v.rating as vendor_rating,
    v.address as vendor_address,
    i.inquiry_ref,
    i.subject as inquiry_subject,
    i.status as inquiry_status,
    u.name as inquiry_created_by
FROM quotes q
LEFT JOIN vendors v ON q.vendor_id = v.vendor_id
LEFT JOIN inquiries i ON q.inquiry_id = i.inquiry_id
LEFT JOIN users u ON i.user_id = u.user_id;

COMMENT ON VIEW quotes_with_details IS '報價詳細資訊視圖（含供應商、詢價資訊）';

-- 15.2 有效報價視圖
CREATE OR REPLACE VIEW valid_quotes AS
SELECT * FROM quotes
WHERE valid_until >= CURRENT_DATE
ORDER BY total_cost_display ASC NULLS LAST;

COMMENT ON VIEW valid_quotes IS '所有尚未過期的報價';

-- 15.3 供應商統計視圖
CREATE OR REPLACE VIEW vendor_statistics AS
SELECT 
    v.vendor_id,
    v.name,
    v.type,
    v.rating,
    COUNT(q.quote_id) as total_quotes,
    COUNT(CASE WHEN q.valid_until >= CURRENT_DATE THEN 1 END) as active_quotes,
    AVG(q.total_cost_display) as avg_quote_amount,
    MIN(q.total_cost_display) as min_quote_amount,
    MAX(q.total_cost_display) as max_quote_amount,
    MAX(q.received_at) as last_quote_date,
    COUNT(vc.contact_id) as contact_count
FROM vendors v
LEFT JOIN quotes q ON v.vendor_id = q.vendor_id
LEFT JOIN vendor_contacts vc ON v.vendor_id = vc.vendor_id
GROUP BY v.vendor_id, v.name, v.type, v.rating;

COMMENT ON VIEW vendor_statistics IS '供應商統計資訊';

-- 15.4 詢價統計視圖
CREATE OR REPLACE VIEW inquiry_statistics AS
SELECT 
    i.inquiry_id,
    i.inquiry_ref,
    i.subject,
    i.status,
    i.vendor_type,
    u.name as created_by,
    COUNT(q.quote_id) as quote_count,
    MIN(q.total_cost_display) as lowest_quote,
    MAX(q.total_cost_display) as highest_quote,
    AVG(q.total_cost_display) as avg_quote,
    i.created_at
FROM inquiries i
LEFT JOIN users u ON i.user_id = u.user_id
LEFT JOIN quotes q ON i.inquiry_id = q.inquiry_id
GROUP BY i.inquiry_id, i.inquiry_ref, i.subject, i.status, i.vendor_type, u.name, i.created_at;

COMMENT ON VIEW inquiry_statistics IS '詢價統計資訊（含報價數量與價格統計）';

-- ============================================================================
-- 16. 實用函數 (Functions)
-- ============================================================================

-- 16.1 搜尋報價函數
CREATE OR REPLACE FUNCTION search_quotes(
    p_vendor_type vendor_type DEFAULT NULL,
    p_origin VARCHAR DEFAULT NULL,
    p_destination VARCHAR DEFAULT NULL,
    p_container_size VARCHAR DEFAULT NULL,
    p_min_price DECIMAL DEFAULT NULL,
    p_max_price DECIMAL DEFAULT NULL,
    p_search_term VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    quote_id INTEGER,
    vendor_name VARCHAR,
    vendor_type vendor_type,
    total_cost_display DECIMAL,
    base_currency VARCHAR,
    origin VARCHAR,
    destination VARCHAR,
    container_size VARCHAR,
    valid_until DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        q.quote_id,
        q.vendor_name,
        q.vendor_type,
        q.total_cost_display,
        q.base_currency,
        q.origin,
        q.destination,
        q.container_size,
        q.valid_until
    FROM quotes q
    WHERE 
        (p_vendor_type IS NULL OR q.vendor_type = p_vendor_type)
        AND (p_origin IS NULL OR q.origin ILIKE '%' || p_origin || '%')
        AND (p_destination IS NULL OR q.destination ILIKE '%' || p_destination || '%')
        AND (p_container_size IS NULL OR q.container_size = p_container_size)
        AND (p_min_price IS NULL OR q.total_cost_display >= p_min_price)
        AND (p_max_price IS NULL OR q.total_cost_display <= p_max_price)
        AND (p_search_term IS NULL OR 
             q.vendor_name ILIKE '%' || p_search_term || '%' OR
             q.remarks ILIKE '%' || p_search_term || '%')
        AND q.valid_until >= CURRENT_DATE
    ORDER BY q.total_cost_display ASC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION search_quotes IS '智能搜尋報價（支援多條件篩選）';

-- 16.2 清理過期報價函數
CREATE OR REPLACE FUNCTION cleanup_expired_quotes(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM quotes
    WHERE valid_until < CURRENT_DATE - days_old;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_expired_quotes IS '清理過期報價（預設 90 天前）';

-- 16.3 取得供應商聯絡人（含主要聯絡人）
CREATE OR REPLACE FUNCTION get_vendor_contacts_json(p_vendor_id INTEGER)
RETURNS JSONB AS $$
BEGIN
    RETURN (
        SELECT JSONB_AGG(
            JSONB_BUILD_OBJECT(
                'id', contact_id,
                'name', name,
                'title', title,
                'email', email,
                'phone', phone,
                'isPrimary', is_primary
            )
            ORDER BY is_primary DESC, name ASC
        )
        FROM vendor_contacts
        WHERE vendor_id = p_vendor_id
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_vendor_contacts_json IS '取得供應商的所有聯絡人（JSON 格式）';

-- ============================================================================
-- 17. 範例資料 (Sample Data)
-- ============================================================================

-- 插入預設用戶
INSERT INTO users (name, email, password_hash, role) VALUES
('系統管理員', 'admin@forwaiq.com', '$2a$10$dummy_hash_for_demo', 'admin'),
('業務人員', 'staff@forwaiq.com', '$2a$10$dummy_hash_for_demo', 'staff')
ON CONFLICT (email) DO NOTHING;

-- 插入範例供應商（僅在表格為空時插入）
INSERT INTO vendors (name, type, address, main_phone, rating, notes)
SELECT '長榮海運', 'shipping'::vendor_type, '台北市中山區', '02-2505-7766', 4.8, '主要合作航線：台灣-中國-東南亞'
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = '長榮海運')
UNION ALL
SELECT '陽明海運', 'shipping'::vendor_type, '基隆市', '02-2455-6688', 4.5, '提供即時船期查詢服務'
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = '陽明海運')
UNION ALL
SELECT '萬海航運', 'shipping'::vendor_type, '台北市內湖區', '02-2793-6555', 4.6, '快速通關服務'
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = '萬海航運')
UNION ALL
SELECT '台灣拖車', 'trucking'::vendor_type, '桃園市', '03-356-7788', 4.7, '24小時服務，專業團隊'
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = '台灣拖車')
UNION ALL
SELECT '新竹貨運', 'trucking'::vendor_type, '新竹市', '03-561-2345', 4.4, '北台灣配送專家'
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = '新竹貨運')
UNION ALL
SELECT '佳鑫報關行', 'customs'::vendor_type, '台北市信義區', '02-2720-1234', 4.9, '專業簽審文件處理，快速通關'
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = '佳鑫報關行')
UNION ALL
SELECT '通關達人', 'customs'::vendor_type, '基隆市', '02-2424-5678', 4.6, 'C3自主管理業者'
WHERE NOT EXISTS (SELECT 1 FROM vendors WHERE name = '通關達人');

-- 插入供應商聯絡人（僅在不存在時插入）
DO $$
DECLARE
    v_vendor_id INTEGER;
BEGIN
    -- 長榮海運聯絡人
    SELECT vendor_id INTO v_vendor_id FROM vendors WHERE name = '長榮海運' LIMIT 1;
    IF v_vendor_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM vendor_contacts WHERE vendor_id = v_vendor_id AND email = 'wang@evergreen.com'
    ) THEN
        INSERT INTO vendor_contacts (vendor_id, name, title, email, phone, is_primary)
        VALUES (v_vendor_id, '王經理', '業務經理', 'wang@evergreen.com', '02-2505-7766', TRUE);
    END IF;

    -- 陽明海運聯絡人
    SELECT vendor_id INTO v_vendor_id FROM vendors WHERE name = '陽明海運' LIMIT 1;
    IF v_vendor_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM vendor_contacts WHERE vendor_id = v_vendor_id AND email = 'lee@yangming.com'
    ) THEN
        INSERT INTO vendor_contacts (vendor_id, name, title, email, phone, is_primary)
        VALUES (v_vendor_id, '李小姐', '客戶經理', 'lee@yangming.com', '02-2455-6688', TRUE);
    END IF;
END $$;

-- ============================================================================
-- 18. 權限設定（可選 - RLS）
-- ============================================================================
-- 如果需要 Row Level Security，可以啟用
-- ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 完成檢查
-- ============================================================================
SELECT 'Schema created successfully!' as status;

SELECT '資料表數量: ' || COUNT(*) as info 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

SELECT '視圖數量: ' || COUNT(*) as info 
FROM information_schema.views 
WHERE table_schema = 'public';

SELECT '索引數量: ' || COUNT(*) as info 
FROM pg_indexes 
WHERE schemaname = 'public';

-- 顯示所有表格
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

