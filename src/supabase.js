import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

export const authService = {
  async register(name, email, pass) {
    const { data, error } = await supabase.auth.signUp({
      email, password: pass, options: { data: { name } }
    })
    if (error) return { error: error.message }
    return { user: data.user }
  },
  async login(email, pass) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass })
    if (error) return { error: error.message }
    return { user: data.user }
  },
  async logout() { await supabase.auth.signOut() },
  async getSession() {
    const { data } = await supabase.auth.getSession()
    return data.session?.user || null
  }
}

export const gymService = {
  async getAll() {
    const { data, error } = await supabase.from('gimnasios').select('*').order('created_at')
    if (error) return []
    return data.map(g => ({
      id: g.id, name: g.nombre, address: g.direccion,
      phone: g.telefono || '', email: g.email || '',
      hours: g.horario || '', lat: g.lat, lng: g.lng,
      color: g.color || '#e63946', rating: g.rating || 5.0,
      status: g.status, visits: g.visitas || 0, distance: '—'
    }))
  },
  async add(gym) {
    const { data, error } = await supabase.from('gimnasios').insert({
      nombre: gym.name, direccion: gym.address,
      telefono: gym.phone, email: gym.email,
      horario: gym.hours, lat: gym.lat, lng: gym.lng,
      color: gym.color || '#4dabf7', rating: 4.5,
      status: 'active', visitas: 0
    }).select()
    if (error) return { error: error.message }
    const g = data[0]
    return { gym: { id: g.id, name: g.nombre, address: g.direccion, phone: g.telefono||'', email: g.email||'', hours: g.horario||'', lat: g.lat, lng: g.lng, color: g.color, rating: g.rating, status: g.status, visits: 0, distance: '—' } }
  },
  async update(id, updates) {
    const mapped = {}
    if (updates.status !== undefined) mapped.status = updates.status
    if (updates.name) mapped.nombre = updates.name
    await supabase.from('gimnasios').update(mapped).eq('id', id)
  },
  async delete(id) {
    await supabase.from('gimnasios').delete().eq('id', id)
  }
}

export const requestService = {
  async getAll() {
    const { data } = await supabase.from('solicitudes_gimnasios').select('*').order('created_at')
    return (data || []).map(r => ({
      id: r.id, name: r.nombre, address: r.direccion,
      phone: r.telefono, email: r.email, hours: r.horario,
      status: r.status, date: new Date(r.created_at).toLocaleDateString('es-MX')
    }))
  },
  async delete(id) {
    await supabase.from('solicitudes_gimnasios').delete().eq('id', id)
  }
}
