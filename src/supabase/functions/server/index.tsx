import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';

const app = new Hono();

// Middleware
app.use('*', cors());
app.use('*', logger(console.log));

// QuoteLineItem interface
interface QuoteLineItem {
  id?: string; // 對應 item_id，新增時可能沒有
  quote_id?: string; // 對應 quote_id，新增時可能沒有
  feeTypeId?: number; // 對應 fee_type_id（前端使用 camelCase）
  description_legacy?: string;
  cost: number;
  currency: string;
  remarks?: string;
  display_order?: number;
  created_at?: string;
}

// Quote interface
interface Quote {
  id: string;
  vendorName: string;
  vendorType: 'shipping' | 'trucking' | 'customs';
  // price: number; // 移除
  // currency: string; // 移除
  validUntil: string;
  createdAt: string;
  updatedAt: string;

  // Shipping specific
  origin?: string;
  destination?: string;
  carrier?: string;
  transitTime?: string;
  containerSize?: string;

  // Trucking specific
  pickupLocation?: string;
  deliveryLocation?: string;
  truckType?: string;

  // Customs specific
  customsType?: string;
  productCategory?: string;

  notes?: string;

  // Custom fields
  customFields?: Record<string, any>;

  // 新增報價明細項目
  lineItems?: QuoteLineItem[];
}

// Get all quotes
app.get('/make-server-368a4ded/quotes', async (c) => {
  try {
    const supabase = getSupabaseClient();

    // Fetch quotes with their line items using Supabase's embedded resources
    const response = await fetch(
      `${supabase.url}/rest/v1/quotes?select=quote_id,vendor_id,inquiry_id,vendor_name,vendor_type,total_cost_display,base_currency,origin,destination,carrier,transit_time,container_size,pickup_location,delivery_location,truck_type,customs_type,product_category,valid_until,notes,custom_fields,received_at,created_at,updated_at,quote_line_items(*)&order=total_cost_display.asc.nullslast,created_at.desc`,
      {
        headers: supabase.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }

    const quotes = await response.json();
    console.log(`Retrieved ${quotes.length} quotes from Supabase`);

    // Convert to camelCase for frontend
    const camelCaseQuotes = toCamelCase(quotes);

    // Rename quote_line_items to lineItems
    const quotesWithLineItems = camelCaseQuotes.map((quote: any) => ({
      ...quote,
      lineItems: quote.quoteLineItems || [],
    }));

    // Remove quoteLineItems field
    quotesWithLineItems.forEach((quote: any) => {
      delete quote.quoteLineItems;
    });

    return c.json(quotesWithLineItems);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return c.json({ error: 'Failed to fetch quotes', details: String(error) }, 500);
  }
});

// Migrate existing quotes to add vendor_id
app.post('/make-server-368a4ded/migrate-vendor-ids', async (c) => {
  try {
    const supabase = getSupabaseClient();

    // Update quotes that have vendor_name but no vendor_id
    const updateResponse = await fetch(
      `${supabase.url}/rest/v1/quotes?vendor_id=is.null`,
      {
        method: 'PATCH',
        headers: {
          ...supabase.headers,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
        },
        body: JSON.stringify({
          // This will be handled by a database function or trigger
        }),
      }
    );

    if (!updateResponse.ok) {
      throw new Error(`Migration failed: ${updateResponse.status}`);
    }

    // Actually, let's do this with raw SQL
    const sqlResponse = await fetch(
      `${supabase.url}/rest/v1/rpc/migrate_vendor_ids`,
      {
        method: 'POST',
        headers: {
          ...supabase.headers,
          'Content-Type': 'application/json',
        },
      }
    );

    if (sqlResponse.ok) {
      const result = await sqlResponse.json();
      return c.json({ success: true, migrated: result });
    } else {
      // Fallback: get all quotes without vendor_id and vendors, then update manually
      const quotesResponse = await fetch(
        `${supabase.url}/rest/v1/quotes?select=quote_id,vendor_name,vendor_type&vendor_id=is.null`,
        {
          headers: supabase.headers,
        }
      );

      const vendorsResponse = await fetch(
        `${supabase.url}/rest/v1/vendors?select=vendor_id,name,type`,
        {
          headers: supabase.headers,
        }
      );

      if (quotesResponse.ok && vendorsResponse.ok) {
        const quotes = await quotesResponse.json();
        const vendors = await vendorsResponse.json();

        let migrated = 0;
        for (const quote of quotes) {
          const matchingVendor = vendors.find((v: any) =>
            v.name === quote.vendor_name && v.type === quote.vendor_type
          );

          if (matchingVendor) {
            const updateResponse = await fetch(
              `${supabase.url}/rest/v1/quotes?quote_id=eq.${quote.quote_id}`,
              {
                method: 'PATCH',
                headers: {
                  ...supabase.headers,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  vendor_id: matchingVendor.vendor_id,
                }),
              }
            );

            if (updateResponse.ok) {
              migrated++;
            }
          }
        }

        return c.json({ success: true, migrated, total: quotes.length });
      }
    }

    return c.json({ error: 'Migration failed' }, 500);
  } catch (error) {
    console.error('Migration error:', error);
    return c.json({ error: 'Migration failed', details: String(error) }, 500);
  }
});

// Get single quote
app.get('/make-server-368a4ded/quotes/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const supabase = getSupabaseClient();

    const response = await fetch(
      `${supabase.url}/rest/v1/quotes?quote_id=eq.${id}&select=*,quote_line_items(*)`,
      {
        headers: supabase.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }

    const quotes = await response.json();

    if (!quotes || quotes.length === 0) {
      return c.json({ error: 'Quote not found' }, 404);
    }

    // Convert to camelCase for frontend
    const camelCaseQuote = toCamelCase(quotes[0]);

    // Rename quote_line_items to lineItems
    const quoteWithLineItems = {
      ...camelCaseQuote,
      lineItems: camelCaseQuote.quoteLineItems || [],
    };

    // Remove quoteLineItems field
    delete quoteWithLineItems.quoteLineItems;

    return c.json(quoteWithLineItems);
  } catch (error) {
    console.error('Error fetching quote:', error);
    return c.json({ error: 'Failed to fetch quote', details: String(error) }, 500);
  }
});

// Create new quote
app.post('/make-server-368a4ded/quotes', async (c) => {
  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.vendorName || !body.vendorType || !body.validUntil || !body.lineItems || !Array.isArray(body.lineItems) || body.lineItems.length === 0) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Validate line items
    for (let i = 0; i < body.lineItems.length; i++) {
      const item = body.lineItems[i];
      // 支援兩種格式：snake_case (description_legacy) 和 camelCase (descriptionLegacy)
      const description = item.description_legacy || item.descriptionLegacy;
      if (!description || !item.cost || !item.currency) {
        return c.json({ error: `Line item ${i + 1}: Missing required fields (description_legacy or descriptionLegacy, cost, currency)` }, 400);
      }
      if (item.cost <= 0) {
        return c.json({ error: `Line item ${i + 1}: Cost must be greater than 0` }, 400);
      }
    }

    const supabase = getSupabaseClient();

    // Calculate total cost and base currency
    const totalCost = body.lineItems.reduce((sum: number, item: any) => sum + item.cost, 0);
    const currencies = [...new Set(body.lineItems.map((item: any) => item.currency))];
    const baseCurrency = currencies.length === 1 ? currencies[0] : 'USD'; // If multiple currencies, default to USD

    // Handle inquiry_id - optional, use provided or null
    let inquiryId = body.inquiryId || null;

    // Handle vendor_id - required from frontend
    let vendorId = body.vendorId;
    if (!vendorId) {
      throw new Error('vendor_id is required');
    }

    // Convert to snake_case for database
    const dbData = {
      inquiry_id: inquiryId,
      vendor_id: vendorId,
      vendor_name: body.vendorName,
      vendor_type: body.vendorType,
      total_cost_display: totalCost,
      base_currency: baseCurrency,
      valid_until: body.validUntil,

      // Optional fields
      origin: body.origin || null,
      destination: body.destination || null,
      carrier: body.carrier || null,
      transit_time: body.transitTime || null,
      container_size: body.containerSize || null,
      pickup_location: body.pickupLocation || null,
      delivery_location: body.deliveryLocation || null,
      truck_type: body.truckType || null,
      customs_type: body.customsType || null,
      product_category: body.productCategory || null,
      notes: body.notes || null,

      // Custom fields
      custom_fields: body.customFields ? JSON.stringify(body.customFields) : '{}',
    };

    const response = await fetch(
      `${supabase.url}/rest/v1/quotes`,
      {
        method: 'POST',
        headers: {
          ...supabase.headers,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(dbData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} ${errorText}`);
    }

    const createdQuotes = await response.json();
    const createdQuote = createdQuotes[0];
    const quoteId = createdQuote.quote_id;

    console.log(`Created quote ${quoteId} for vendor ${createdQuote.vendor_name}`);

    // Create line items
    const lineItemsData = body.lineItems.map((item: any, index: number) => ({
      quote_id: quoteId,
      fee_type_id: item.fee_type_id || item.feeTypeId, // 支援兩種格式
      description_legacy: item.description_legacy || item.descriptionLegacy, // 支援兩種格式
      cost: item.cost,
      currency: item.currency,
      remarks: item.remarks || null,
      display_order: index,
    }));

    const lineItemsResponse = await fetch(
      `${supabase.url}/rest/v1/quote_line_items`,
      {
        method: 'POST',
        headers: {
          ...supabase.headers,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(lineItemsData),
      }
    );

    if (!lineItemsResponse.ok) {
      const errorText = await lineItemsResponse.text();
      console.error('Failed to create line items:', errorText);
      // Note: Quote is already created, we might want to delete it or handle this error differently
      throw new Error(`Failed to create line items: ${errorText}`);
    }

    const createdLineItems = await lineItemsResponse.json();
    console.log(`Created ${createdLineItems.length} line items for quote ${quoteId}`);

    // Convert to camelCase for frontend
    const camelCaseQuote = toCamelCase(createdQuote);
    const camelCaseLineItems = toCamelCase(createdLineItems);

    // Add lineItems to the response
    camelCaseQuote.lineItems = camelCaseLineItems;

    return c.json(camelCaseQuote, 201);
  } catch (error) {
    console.error('Error creating quote:', error);
    return c.json({ error: 'Failed to create quote', details: String(error) }, 500);
  }
});

// Batch create quotes
app.post('/make-server-368a4ded/quotes/batch', async (c) => {
  try {
    const body = await c.req.json();
    const quotesData = body.quotes || [];
    
    if (!Array.isArray(quotesData) || quotesData.length === 0) {
      return c.json({ error: 'Invalid quotes array' }, 400);
    }
    
    const errors: string[] = [];
    const dbQuotes = [];
    
    for (let i = 0; i < quotesData.length; i++) {
      const quoteData = quotesData[i];
      
      // Validate required fields
      if (!quoteData.vendorName || !quoteData.vendorType || !quoteData.price || !quoteData.currency || !quoteData.validUntil) {
        errors.push(`Quote ${i + 1}: Missing required fields`);
        continue;
      }
      
      dbQuotes.push({
        vendor_id: quoteData.vendorId || null,
        vendor_name: quoteData.vendorName,
        vendor_type: quoteData.vendorType,
        price: parseFloat(quoteData.price),
        currency: quoteData.currency,
        valid_until: quoteData.validUntil,
        origin: quoteData.origin || null,
        destination: quoteData.destination || null,
        carrier: quoteData.carrier || null,
        transit_time: quoteData.transitTime || null,
        container_size: quoteData.containerSize || null,
        pickup_location: quoteData.pickupLocation || null,
        delivery_location: quoteData.deliveryLocation || null,
        truck_type: quoteData.truckType || null,
        customs_type: quoteData.customsType || null,
        product_category: quoteData.productCategory || null,
        notes: quoteData.notes || null,
        custom_fields: quoteData.customFields ? JSON.stringify(quoteData.customFields) : '{}',
      });
    }
    
    const supabase = getSupabaseClient();
    
    const response = await fetch(
      `${supabase.url}/rest/v1/quotes`,
      {
        method: 'POST',
        headers: {
          ...supabase.headers,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(dbQuotes),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} ${errorText}`);
    }
    
    const createdQuotes = await response.json();
    
    console.log(`Batch created ${createdQuotes.length} quotes with ${errors.length} errors`);
    
    // Convert to camelCase for frontend
    const camelCaseQuotes = toCamelCase(createdQuotes);
    
    return c.json({
      success: true,
      created: createdQuotes.length,
      errors: errors.length > 0 ? errors : undefined,
      quotes: camelCaseQuotes,
    }, 201);
  } catch (error) {
    console.error('Error batch creating quotes:', error);
    return c.json({ error: 'Failed to batch create quotes', details: String(error) }, 500);
  }
});

// Update quote
app.put('/make-server-368a4ded/quotes/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const body = await c.req.json();

    // Validate line items if provided
    if (body.lineItems !== undefined) {
      if (!Array.isArray(body.lineItems) || body.lineItems.length === 0) {
        return c.json({ error: 'lineItems must be a non-empty array' }, 400);
      }

      for (let i = 0; i < body.lineItems.length; i++) {
        const item = body.lineItems[i];
        // 支援兩種格式：snake_case (description_legacy) 和 camelCase (descriptionLegacy)
        const description = item.description_legacy || item.descriptionLegacy;
        if (!description || !item.cost || !item.currency) {
          return c.json({ error: `Line item ${i + 1}: Missing required fields (description_legacy or descriptionLegacy, cost, currency)` }, 400);
        }
        if (item.cost <= 0) {
          return c.json({ error: `Line item ${i + 1}: Cost must be greater than 0` }, 400);
        }
      }
    }

    const supabase = getSupabaseClient();

    // Convert to snake_case for database
    const dbData: any = {};
    if (body.vendorId !== undefined) dbData.vendor_id = body.vendorId;
    if (body.vendorName !== undefined) dbData.vendor_name = body.vendorName;
    if (body.vendorType !== undefined) dbData.vendor_type = body.vendorType;

    // Recalculate total cost and base currency if lineItems are provided
    if (body.lineItems !== undefined) {
      const totalCost = body.lineItems.reduce((sum: number, item: any) => sum + item.cost, 0);
      const currencies = [...new Set(body.lineItems.map((item: any) => item.currency))];
      const baseCurrency = currencies.length === 1 ? currencies[0] : 'USD';

      dbData.total_cost_display = totalCost;
      dbData.base_currency = baseCurrency;
    }

    if (body.validUntil !== undefined) dbData.valid_until = body.validUntil;
    if (body.origin !== undefined) dbData.origin = body.origin;
    if (body.destination !== undefined) dbData.destination = body.destination;
    if (body.carrier !== undefined) dbData.carrier = body.carrier;
    if (body.transitTime !== undefined) dbData.transit_time = body.transitTime;
    if (body.containerSize !== undefined) dbData.container_size = body.containerSize;
    if (body.pickupLocation !== undefined) dbData.pickup_location = body.pickupLocation;
    if (body.deliveryLocation !== undefined) dbData.delivery_location = body.deliveryLocation;
    if (body.truckType !== undefined) dbData.truck_type = body.truckType;
    if (body.customsType !== undefined) dbData.customs_type = body.customsType;
    if (body.productCategory !== undefined) dbData.product_category = body.productCategory;
    if (body.notes !== undefined) dbData.notes = body.notes;
    if (body.customFields !== undefined) dbData.custom_fields = JSON.stringify(body.customFields);

    const response = await fetch(
      `${supabase.url}/rest/v1/quotes?quote_id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          ...supabase.headers,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(dbData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} ${errorText}`);
    }

    const updatedQuotes = await response.json();

    if (!updatedQuotes || updatedQuotes.length === 0) {
      return c.json({ error: 'Quote not found' }, 404);
    }

    const updatedQuote = updatedQuotes[0];
    console.log(`Updated quote ${id}`);

    // Update line items if provided
    if (body.lineItems !== undefined) {
      // Delete existing line items
      await fetch(
        `${supabase.url}/rest/v1/quote_line_items?quote_id=eq.${id}`,
        {
          method: 'DELETE',
          headers: supabase.headers,
        }
      );

      // Create new line items
      const lineItemsData = body.lineItems.map((item: any, index: number) => ({
        quote_id: parseInt(id),
        fee_type_id: item.fee_type_id || item.feeTypeId, // 支援兩種格式
        description_legacy: item.description_legacy || item.descriptionLegacy, // 支援兩種格式
        cost: item.cost,
        currency: item.currency,
        remarks: item.remarks || null,
        display_order: index,
      }));

      const lineItemsResponse = await fetch(
        `${supabase.url}/rest/v1/quote_line_items`,
        {
          method: 'POST',
          headers: {
            ...supabase.headers,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(lineItemsData),
        }
      );

      if (!lineItemsResponse.ok) {
        const errorText = await lineItemsResponse.text();
        console.error('Failed to update line items:', errorText);
        throw new Error(`Failed to update line items: ${errorText}`);
      }

      const updatedLineItems = await lineItemsResponse.json();
      console.log(`Updated ${updatedLineItems.length} line items for quote ${id}`);
    }

    // Fetch updated quote with line items
    const finalResponse = await fetch(
      `${supabase.url}/rest/v1/quotes?quote_id=eq.${id}&select=*,quote_line_items(*)`,
      {
        headers: supabase.headers,
      }
    );

    if (!finalResponse.ok) {
      throw new Error(`Failed to fetch updated quote: ${finalResponse.status}`);
    }

    const finalQuotes = await finalResponse.json();
    if (!finalQuotes || finalQuotes.length === 0) {
      return c.json({ error: 'Quote not found after update' }, 404);
    }

    // Convert to camelCase for frontend
    const camelCaseQuote = toCamelCase(finalQuotes[0]);

    // Rename quote_line_items to lineItems
    const quoteWithLineItems = {
      ...camelCaseQuote,
      lineItems: camelCaseQuote.quoteLineItems || [],
    };

    // Remove quoteLineItems field
    delete quoteWithLineItems.quoteLineItems;

    return c.json(quoteWithLineItems);
  } catch (error) {
    console.error('Error updating quote:', error);
    return c.json({ error: 'Failed to update quote', details: String(error) }, 500);
  }
});

// Delete quote
app.delete('/make-server-368a4ded/quotes/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'), 10);
    const supabase = getSupabaseClient();
    
    const response = await fetch(
      `${supabase.url}/rest/v1/quotes?quote_id=eq.${id}`,
      {
        method: 'DELETE',
        headers: supabase.headers,
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} ${errorText}`);
    }
    
    console.log(`Deleted quote ${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting quote:', error);
    return c.json({ error: 'Failed to delete quote', details: String(error) }, 500);
  }
});

// Search quotes by criteria
app.post('/make-server-368a4ded/quotes/search', async (c) => {
  try {
    const { vendorType, origin, destination, containerSize, minPrice, maxPrice } = await c.req.json();
    
    const supabase = getSupabaseClient();
    
    // Build query parameters
    const params = new URLSearchParams();
    
    if (vendorType && vendorType !== 'all') {
      params.append('vendor_type', `eq.${vendorType}`);
    }
    
    if (origin) {
      params.append('origin', `ilike.*${origin}*`);
    }
    
    if (destination) {
      params.append('destination', `ilike.*${destination}*`);
    }
    
    if (containerSize) {
      params.append('container_size', `eq.${containerSize}`);
    }
    
    if (minPrice !== undefined) {
      params.append('price', `gte.${minPrice}`);
    }
    
    if (maxPrice !== undefined) {
      params.append('price', `lte.${maxPrice}`);
    }
    
    // Add sorting
    params.append('order', 'price.asc');
    
    const response = await fetch(
      `${supabase.url}/rest/v1/quotes?${params.toString()}`,
      {
        headers: supabase.headers,
      }
    );
    
    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }
    
    const quotes = await response.json();
    console.log(`Search found ${quotes.length} quotes`);
    
    // Convert to camelCase for frontend
    const camelCaseQuotes = toCamelCase(quotes);
    
    return c.json(camelCaseQuotes);
  } catch (error) {
    console.error('Error searching quotes:', error);
    return c.json({ error: 'Failed to search quotes', details: String(error) }, 500);
  }
});

// FeeType interface
interface FeeType {
  id: string;
  name: string;
  category: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Vendor interface
interface Vendor {
  id: string;
  name: string;
  type: 'shipping' | 'trucking' | 'customs';
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  rating?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// Get all fee types
app.get('/make-server-368a4ded/fee-types', async (c) => {
  try {
    const supabase = getSupabaseClient();

    const response = await fetch(
      `${supabase.url}/rest/v1/fee_types?order=name.asc`,
      {
        headers: supabase.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }

    const feeTypes = await response.json();
    console.log(`Retrieved ${feeTypes.length} fee types from Supabase`);

    // Convert to camelCase for frontend
    const camelCaseFeeTypes = toCamelCase(feeTypes);

    return c.json(camelCaseFeeTypes);
  } catch (error) {
    console.error('Error fetching fee types:', error);
    return c.json({ error: 'Failed to fetch fee types', details: String(error) }, 500);
  }
});

// Create new fee type
app.post('/make-server-368a4ded/fee-types', async (c) => {
  try {
    const body = await c.req.json();

    // Validate required fields
    if (!body.name || !body.category) {
      return c.json({ error: 'Missing required fields (name, category)' }, 400);
    }

    // Validate category
    if (!['海運', '拖車', '報關'].includes(body.category)) {
      return c.json({ error: 'Invalid category. Must be one of: 海運, 拖車, 報關' }, 400);
    }

    const supabase = getSupabaseClient();

    // Convert to snake_case for database
    const dbData = {
      name: body.name.trim(),
      category: body.category,
      description: body.description || null,
      is_active: true,
    };

    const response = await fetch(
      `${supabase.url}/rest/v1/fee_types`,
      {
        method: 'POST',
        headers: {
          ...supabase.headers,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(dbData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} ${errorText}`);
    }

    const createdFeeTypes = await response.json();
    const createdFeeType = createdFeeTypes[0];

    console.log(`Created fee type ${createdFeeType.fee_type_id}: ${createdFeeType.name}`);

    // Convert to camelCase for frontend
    const camelCaseFeeType = toCamelCase(createdFeeType);

    return c.json(camelCaseFeeType, 201);
  } catch (error) {
    console.error('Error creating fee type:', error);
    return c.json({ error: 'Failed to create fee type', details: String(error) }, 500);
  }
});

// Get all vendors
app.get('/make-server-368a4ded/vendors', async (c) => {
  try {
    const supabase = getSupabaseClient();
    
    // Fetch vendors with their contacts using Supabase's embedded resources
    const response = await fetch(
      `${supabase.url}/rest/v1/vendors?select=*,vendor_contacts(*)&order=name.asc`,
      {
        headers: supabase.headers,
      }
    );
    
    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }
    
    const vendors = await response.json();
    console.log(`Retrieved ${vendors.length} vendors from Supabase`);
    
    // Convert to camelCase for frontend
    const camelCaseVendors = toCamelCase(vendors);
    
    // Rename vendor_contacts to contacts
    const vendorsWithContacts = camelCaseVendors.map((vendor: any) => ({
      ...vendor,
      contacts: vendor.vendorContacts || [],
    }));
    
    // Remove vendorContacts field
    vendorsWithContacts.forEach((vendor: any) => {
      delete vendor.vendorContacts;
    });
    
    return c.json(vendorsWithContacts);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return c.json({ error: 'Failed to fetch vendors', details: String(error) }, 500);
  }
});

// Get single vendor
app.get('/make-server-368a4ded/vendors/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const response = await fetch(
      `${supabase.url}/rest/v1/vendors?vendor_id=eq.${id}&select=*,vendor_contacts(*)`,
      {
        headers: supabase.headers,
      }
    );
    
    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }
    
    const vendors = await response.json();
    
    if (!vendors || vendors.length === 0) {
      return c.json({ error: 'Vendor not found' }, 404);
    }
    
    // Convert to camelCase for frontend
    const camelCaseVendor = toCamelCase(vendors[0]);
    
    // Rename vendor_contacts to contacts
    camelCaseVendor.contacts = camelCaseVendor.vendorContacts || [];
    delete camelCaseVendor.vendorContacts;
    
    return c.json(camelCaseVendor);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return c.json({ error: 'Failed to fetch vendor', details: String(error) }, 500);
  }
});

// Create new vendor
app.post('/make-server-368a4ded/vendors', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.name || !body.type) {
      return c.json({ error: 'Missing required fields (name, type)' }, 400);
    }
    
    const supabase = getSupabaseClient();
    
    // Convert to snake_case for database
    const dbData = {
      name: body.name,
      type: body.type,
      address: body.address || null,
      rating: body.rating || 5.0,
      notes: body.notes || null,
    };
    
    // Create vendor
    const response = await fetch(
      `${supabase.url}/rest/v1/vendors`,
      {
        method: 'POST',
        headers: {
          ...supabase.headers,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(dbData),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} ${errorText}`);
    }
    
    const createdVendors = await response.json();
    const createdVendor = createdVendors[0];
    const vendorId = createdVendor.vendor_id;
    
    console.log(`Created vendor ${vendorId}: ${createdVendor.name}`);
    
    // Create contacts if provided
    const contacts = body.contacts || [];
    const createdContacts = [];
    
    if (contacts.length > 0) {
      for (const contact of contacts) {
        const contactData = {
          vendor_id: vendorId,
          name: contact.name || '',
          title: contact.title || null,
          email: contact.email || null,
          phone: contact.phone || null,
          is_primary: contact.isPrimary || false,
        };
        
        const contactResponse = await fetch(
          `${supabase.url}/rest/v1/vendor_contacts`,
          {
            method: 'POST',
            headers: {
              ...supabase.headers,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(contactData),
          }
        );
        
        if (contactResponse.ok) {
          const createdContactArray = await contactResponse.json();
          createdContacts.push(createdContactArray[0]);
        }
      }
    }
    
    // Convert to camelCase for frontend
    const camelCaseVendor = toCamelCase(createdVendor);
    const camelCaseContacts = toCamelCase(createdContacts);
    
    camelCaseVendor.contacts = camelCaseContacts;
    
    return c.json(camelCaseVendor, 201);
  } catch (error) {
    console.error('Error creating vendor:', error);
    return c.json({ error: 'Failed to create vendor', details: String(error) }, 500);
  }
});

// Update vendor
app.put('/make-server-368a4ded/vendors/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    const supabase = getSupabaseClient();
    
    // Convert to snake_case for database
    const dbData: any = {};
    if (body.name !== undefined) dbData.name = body.name;
    if (body.type !== undefined) dbData.type = body.type;
    if (body.address !== undefined) dbData.address = body.address;
    if (body.rating !== undefined) dbData.rating = body.rating;
    if (body.notes !== undefined) dbData.notes = body.notes;
    
    // Update vendor
    const response = await fetch(
      `${supabase.url}/rest/v1/vendors?vendor_id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          ...supabase.headers,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(dbData),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} ${errorText}`);
    }
    
    const updatedVendors = await response.json();
    
    if (!updatedVendors || updatedVendors.length === 0) {
      return c.json({ error: 'Vendor not found' }, 404);
    }
    
    const updatedVendor = updatedVendors[0];
    console.log(`Updated vendor ${id}`);
    
    // Update contacts if provided
    if (body.contacts !== undefined) {
      // Delete existing contacts
      await fetch(
        `${supabase.url}/rest/v1/vendor_contacts?vendor_id=eq.${id}`,
        {
          method: 'DELETE',
          headers: supabase.headers,
        }
      );
      
      // Create new contacts
      const contacts = body.contacts || [];
      for (const contact of contacts) {
        const contactData = {
          vendor_id: parseInt(id),
          name: contact.name || '',
          title: contact.title || null,
          email: contact.email || null,
          phone: contact.phone || null,
          is_primary: contact.isPrimary || false,
        };
        
        await fetch(
          `${supabase.url}/rest/v1/vendor_contacts`,
          {
            method: 'POST',
            headers: {
              ...supabase.headers,
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(contactData),
          }
        );
      }
    }
    
    // Fetch updated vendor with contacts
    const finalResponse = await fetch(
      `${supabase.url}/rest/v1/vendors?vendor_id=eq.${id}&select=*,vendor_contacts(*)`,
      {
        headers: supabase.headers,
      }
    );
    
    if (finalResponse.ok) {
      const finalVendors = await finalResponse.json();
      if (finalVendors.length > 0) {
        const camelCaseVendor = toCamelCase(finalVendors[0]);
        camelCaseVendor.contacts = camelCaseVendor.vendorContacts || [];
        delete camelCaseVendor.vendorContacts;
        return c.json(camelCaseVendor);
      }
    }
    
    // Fallback: return vendor without contacts
    const camelCaseVendor = toCamelCase(updatedVendor);
    camelCaseVendor.contacts = [];
    return c.json(camelCaseVendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    return c.json({ error: 'Failed to update vendor', details: String(error) }, 500);
  }
});

// Delete vendor
app.delete('/make-server-368a4ded/vendors/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const response = await fetch(
      `${supabase.url}/rest/v1/vendors?vendor_id=eq.${id}`,
      {
        method: 'DELETE',
        headers: supabase.headers,
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} ${errorText}`);
    }
    
    console.log(`Deleted vendor ${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return c.json({ error: 'Failed to delete vendor', details: String(error) }, 500);
  }
});

// Send inquiry emails
app.post('/make-server-368a4ded/send-inquiry', async (c) => {
  try {
    const body = await c.req.json();
    const { vendorIds, subject, content, inquiryData } = body;
    
    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return c.json({ error: 'Invalid vendor IDs' }, 400);
    }
    
    const supabase = getSupabaseClient();
    
    // Get vendor details from database
    const vendorIdsParam = vendorIds.map(id => `"${id}"`).join(',');
    const vendorsResponse = await fetch(
      `${supabase.url}/rest/v1/vendors?id=in.(${vendorIdsParam})`,
      {
        headers: supabase.headers,
      }
    );
    
    if (!vendorsResponse.ok) {
      throw new Error(`Supabase error: ${vendorsResponse.status} ${vendorsResponse.statusText}`);
    }
    
    const vendors = await vendorsResponse.json();
    const validVendors = vendors.filter((v: any) => v && v.email);
    
    if (validVendors.length === 0) {
      return c.json({ error: 'No vendors with valid email addresses found' }, 400);
    }
    
    // Create inquiry record in database
    const inquiryDbData = {
      subject,
      content,
      inquiry_data: inquiryData ? JSON.stringify(inquiryData) : '{}',
    };
    
    const inquiryResponse = await fetch(
      `${supabase.url}/rest/v1/inquiries`,
      {
        method: 'POST',
        headers: {
          ...supabase.headers,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(inquiryDbData),
      }
    );
    
    if (!inquiryResponse.ok) {
      const errorText = await inquiryResponse.text();
      throw new Error(`Supabase error: ${inquiryResponse.status} ${errorText}`);
    }
    
    const createdInquiries = await inquiryResponse.json();
    const inquiry = createdInquiries[0];
    
    // Create inquiry-vendor relationships
    const inquiryVendorRecords = validVendors.map((v: any) => ({
      inquiry_id: inquiry.id,
      vendor_id: v.id,
      email: v.email,
      sent_status: 'sent',
      sent_at: new Date().toISOString(),
    }));
    
    await fetch(
      `${supabase.url}/rest/v1/inquiry_vendors`,
      {
        method: 'POST',
        headers: supabase.headers,
        body: JSON.stringify(inquiryVendorRecords),
      }
    );
    
    console.log(`Inquiry ${inquiry.id} sent to ${validVendors.length} vendors`);
    console.log(`Recipients: ${validVendors.map((v: any) => v.email).join(', ')}`);
    console.log(`Subject: ${subject}`);
    
    // In a production environment, you would integrate with an email service like:
    // - SendGrid
    // - AWS SES
    // - Resend
    // - Mailgun
    
    return c.json({
      success: true,
      inquiryId: inquiry.id,
      sentTo: validVendors.length,
      recipients: validVendors.map((v: any) => ({ name: v.name, email: v.email })),
      message: 'Inquiry logged successfully. In production, emails would be sent via email service.',
    });
  } catch (error) {
    console.error('Error sending inquiry:', error);
    return c.json({ error: 'Failed to send inquiry', details: String(error) }, 500);
  }
});

// Custom Field interface
interface CustomField {
  id: string;
  name: string;
  fieldType: 'text' | 'number' | 'select' | 'date' | 'textarea';
  vendorType: 'shipping' | 'trucking' | 'customs';
  options?: string[];
  isRequired: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// Helper function to get Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  
  return {
    url: supabaseUrl,
    key: supabaseKey,
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
    }
  };
};

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      let camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      
      // 特殊處理：將主鍵欄位轉換為適當的字段名稱，避免衝突
      if (key === 'quote_id') camelKey = 'id'; // Quote的主鍵
      if (key === 'vendor_id') camelKey = 'vendorId'; // Quote中的供應商ID
      if (key === 'inquiry_id') camelKey = 'inquiryId'; // Quote中的詢價單ID
      if (key === 'contact_id') camelKey = 'id'; // VendorContact的主鍵
      if (key === 'item_id') camelKey = 'itemId'; // QuoteLineItem的主鍵，避免與Quote的id衝突
      if (key === 'fee_type_id') camelKey = 'feeTypeId'; // 費用類型ID
      if (key === 'display_order') camelKey = 'order';
      
      acc[camelKey] = toCamelCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
};

// Helper function to convert camelCase to snake_case
const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toSnakeCase);
  }
  
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      acc[snakeKey] = toSnakeCase(obj[key]);
      return acc;
    }, {} as any);
  }
  
  return obj;
};

// Get all custom fields
app.get('/make-server-368a4ded/custom-fields', async (c) => {
  try {
    const supabase = getSupabaseClient();
    
    const response = await fetch(
      `${supabase.url}/rest/v1/custom_fields?order=vendor_type.asc,display_order.asc`,
      {
        headers: supabase.headers,
      }
    );
    
    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }
    
    const fields = await response.json();
    console.log(`Retrieved ${fields.length} custom fields from Supabase`);
    
    // Convert to camelCase for frontend
    const camelCaseFields = toCamelCase(fields);
    
    return c.json(camelCaseFields);
  } catch (error) {
    console.error('Error fetching custom fields:', error);
    return c.json({ error: 'Failed to fetch custom fields', details: String(error) }, 500);
  }
});

// Get custom fields by vendor type
app.get('/make-server-368a4ded/custom-fields/vendor/:vendorType', async (c) => {
  try {
    const vendorType = c.req.param('vendorType') as 'shipping' | 'trucking' | 'customs';
    const supabase = getSupabaseClient();
    
    const response = await fetch(
      `${supabase.url}/rest/v1/custom_fields?vendor_type=eq.${vendorType}&order=display_order.asc`,
      {
        headers: supabase.headers,
      }
    );
    
    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }
    
    const fields = await response.json();
    console.log(`Retrieved ${fields.length} custom fields for ${vendorType} from Supabase`);
    
    // Convert to camelCase for frontend
    const camelCaseFields = toCamelCase(fields);
    
    return c.json(camelCaseFields);
  } catch (error) {
    console.error('Error fetching custom fields by vendor type:', error);
    return c.json({ error: 'Failed to fetch custom fields', details: String(error) }, 500);
  }
});

// Get single custom field
app.get('/make-server-368a4ded/custom-fields/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const response = await fetch(
      `${supabase.url}/rest/v1/custom_fields?id=eq.${id}`,
      {
        headers: supabase.headers,
      }
    );
    
    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status} ${response.statusText}`);
    }
    
    const fields = await response.json();
    
    if (!fields || fields.length === 0) {
      return c.json({ error: 'Custom field not found' }, 404);
    }
    
    // Convert to camelCase for frontend
    const camelCaseField = toCamelCase(fields[0]);
    
    return c.json(camelCaseField);
  } catch (error) {
    console.error('Error fetching custom field:', error);
    return c.json({ error: 'Failed to fetch custom field', details: String(error) }, 500);
  }
});

// Create new custom field
app.post('/make-server-368a4ded/custom-fields', async (c) => {
  try {
    const body = await c.req.json();
    
    // Validate required fields
    if (!body.name || !body.fieldType || !body.vendorType) {
      return c.json({ error: 'Missing required fields (name, fieldType, vendorType)' }, 400);
    }
    
    // Validate select type has options
    if (body.fieldType === 'select' && (!body.options || body.options.length === 0)) {
      return c.json({ error: 'Select field type requires at least one option' }, 400);
    }
    
    const supabase = getSupabaseClient();
    
    // Convert to snake_case for database
    const dbData = {
      name: body.name,
      field_type: body.fieldType,
      vendor_type: body.vendorType,
      options: body.options ? JSON.stringify(body.options) : '[]',
      is_required: body.isRequired || false,
      display_order: body.order || 1,
    };
    
    const response = await fetch(
      `${supabase.url}/rest/v1/custom_fields`,
      {
        method: 'POST',
        headers: {
          ...supabase.headers,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(dbData),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} ${errorText}`);
    }
    
    const createdFields = await response.json();
    const createdField = createdFields[0];
    
    console.log(`Created custom field ${createdField.id}: ${createdField.name}`);
    
    // Convert to camelCase for frontend
    const camelCaseField = toCamelCase(createdField);
    
    return c.json(camelCaseField, 201);
  } catch (error) {
    console.error('Error creating custom field:', error);
    return c.json({ error: 'Failed to create custom field', details: String(error) }, 500);
  }
});

// Update custom field
app.put('/make-server-368a4ded/custom-fields/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    // Validate select type has options
    if (body.fieldType === 'select' && (!body.options || body.options.length === 0)) {
      return c.json({ error: 'Select field type requires at least one option' }, 400);
    }
    
    const supabase = getSupabaseClient();
    
    // Convert to snake_case for database
    const dbData: any = {};
    if (body.name !== undefined) dbData.name = body.name;
    if (body.fieldType !== undefined) dbData.field_type = body.fieldType;
    if (body.vendorType !== undefined) dbData.vendor_type = body.vendorType;
    if (body.options !== undefined) dbData.options = JSON.stringify(body.options);
    if (body.isRequired !== undefined) dbData.is_required = body.isRequired;
    if (body.order !== undefined) dbData.display_order = body.order;
    
    const response = await fetch(
      `${supabase.url}/rest/v1/custom_fields?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: {
          ...supabase.headers,
          'Prefer': 'return=representation',
        },
        body: JSON.stringify(dbData),
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} ${errorText}`);
    }
    
    const updatedFields = await response.json();
    
    if (!updatedFields || updatedFields.length === 0) {
      return c.json({ error: 'Custom field not found' }, 404);
    }
    
    const updatedField = updatedFields[0];
    console.log(`Updated custom field ${id}`);
    
    // Convert to camelCase for frontend
    const camelCaseField = toCamelCase(updatedField);
    
    return c.json(camelCaseField);
  } catch (error) {
    console.error('Error updating custom field:', error);
    return c.json({ error: 'Failed to update custom field', details: String(error) }, 500);
  }
});

// Delete custom field
app.delete('/make-server-368a4ded/custom-fields/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const supabase = getSupabaseClient();
    
    const response = await fetch(
      `${supabase.url}/rest/v1/custom_fields?id=eq.${id}`,
      {
        method: 'DELETE',
        headers: supabase.headers,
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Supabase error: ${response.status} ${errorText}`);
    }
    
    console.log(`Deleted custom field ${id}`);
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting custom field:', error);
    return c.json({ error: 'Failed to delete custom field', details: String(error) }, 500);
  }
});

// Health check
app.get('/make-server-368a4ded/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);
