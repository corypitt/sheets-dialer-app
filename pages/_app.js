import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import {
  SessionContextProvider,
  useSession,
  useSupabaseClient
} from '@supabase/auth-helpers-react';
import { Analytics } from '@vercel/analytics/react';

// Rest of your App component code... 