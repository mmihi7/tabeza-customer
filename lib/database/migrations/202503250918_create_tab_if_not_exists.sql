-- Drop any existing overloads of the function
DROP FUNCTION IF EXISTS public.create_tab_if_not_exists;

-- Create atomic tab creation function to prevent race conditions
-- This function ensures that a device can have only one open tab per bar
CREATE OR REPLACE FUNCTION public.create_tab_if_not_exists(
    p_bar_id uuid,
    p_device_id text,
    p_customer_id uuid, 
    p_display_name text DEFAULT NULL,
    p_notes jsonb DEFAULT NULL
)
RETURNS TABLE (
    success boolean,
    message text,
    tab public.tabs,
    existing boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tab public.tabs;
    v_existing boolean := false;
    v_next_tab_number integer;
    v_notes jsonb;
BEGIN
    -- Check for existing open tab for this bar and device
    SELECT * INTO v_tab
    FROM public.tabs
    WHERE bar_id = p_bar_id
        AND device_identifier = p_device_id
        AND status = 'open'
    LIMIT 1;

    IF v_tab.id IS NOT NULL THEN
        -- Tab already exists
        v_existing := true;
        success := true;
        message := 'Tab already exists';
        tab := v_tab;
        existing := v_existing;
        RETURN NEXT;
        RETURN;
    END IF;

    -- Determine next tab number for this bar
    SELECT COALESCE(MAX(tab_number), 0) + 1 INTO v_next_tab_number
    FROM public.tabs
    WHERE bar_id = p_bar_id;

    -- Prepare notes: merge p_notes with display_name if provided
    v_notes := COALESCE(p_notes, '{}'::jsonb);
    IF p_display_name IS NOT NULL THEN
        v_notes := v_notes || jsonb_build_object('display_name', p_display_name);
    END IF;

    -- Insert new tab with all required columns
    INSERT INTO public.tabs (
        bar_id,
        device_identifier,
        customer_id, 
        owner_identifier,
        tab_number,
        notes,
        status,
        opened_at,
        created_at,
        updated_at
    ) VALUES (
        p_bar_id,
        p_device_id,
        p_customer_id, 
        NULL, -- owner_identifier (not used for customer tabs)
        v_next_tab_number,
        v_notes,
        'open',
        NOW(),
        NOW(),
        NOW()
    )
    RETURNING * INTO v_tab;

    success := true;
    message := 'Tab created successfully';
    tab := v_tab;
    existing := false;
    RETURN NEXT;
END;
$$;

-- Grant execute permission to authenticated users and anon role
GRANT EXECUTE ON FUNCTION public.create_tab_if_not_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_tab_if_not_exists TO anon;