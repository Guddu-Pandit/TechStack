
import postgres from 'postgres'

const connectionString = process.env.NEXT_PUBLIC_SUPABASE_URL
const sql = postgres(connectionString)

export default sql