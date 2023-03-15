import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://fspyoboqrfjpbrqgtlfq.supabase.co";
const supabaseAnonKey =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzcHlvYm9xcmZqcGJycWd0bGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzg0NjA5MDYsImV4cCI6MTk5NDAzNjkwNn0.vvR21pfCMKP7NmpjdoI2uzwqbUEbG8d3xP5UhvGyjpU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		storage: AsyncStorage as any,
		autoRefreshToken: true,
		persistSession: true,
		detectSessionInUrl: false,
	},
});
