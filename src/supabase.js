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
  },
  async changePassword(newPass) {
    const { error } = await supabase.auth.updateUser({ password: newPass })
    return error ? { error: error.message } : { ok: true }
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
      status: g.status, visits: g.visitas || 0, distance: '—',
      code: g.codigo || ''
    }))
  },
  async add(gym) {
    const { data, error } = await supabase.from('gimnasios').insert({
      nombre: gym.name, direccion: gym.address,
      telefono: gym.phone, email: gym.email,
      horario: gym.hours, lat: gym.lat, lng: gym.lng,
      color: gym.color || '#4dabf7', rating: 4.5,
      status: 'active', visitas: 0, codigo: gym.code || ''
    }).select()
    if (error) return { error: error.message }
    const g = data[0]
    return { gym: { id: g.id, name: g.nombre, address: g.direccion, phone: g.telefono||'', email: g.email||'', hours: g.horario||'', lat: g.lat, lng: g.lng, color: g.color, rating: g.rating, status: g.status, visits: 0, distance: '—', code: g.codigo||'' } }
  },
  async update(id, updates) {
    const mapped = {}
    if (updates.status !== undefined) mapped.status = updates.status
    if (updates.name !== undefined) mapped.nombre = updates.name
    if (updates.address !== undefined) mapped.direccion = updates.address
    if (updates.phone !== undefined) mapped.telefono = updates.phone
    if (updates.email !== undefined) mapped.email = updates.email
    if (updates.hours !== undefined) mapped.horario = updates.hours
    if (updates.lat !== undefined) mapped.lat = updates.lat
    if (updates.lng !== undefined) mapped.lng = updates.lng
    if (updates.code !== undefined) mapped.codigo = updates.code
    const { error } = await supabase.from('gimnasios').update(mapped).eq('id', id)
    if (error) return { error: error.message }
    return { ok: true }
  },
  async delete(id) {
    await supabase.from('gimnasios').delete().eq('id', id)
  }
}

export const visitService = {
  async add(usuario_id, gimnasio_id) {
    console.log('[visitService.add] inserting:', { usuario_id, gimnasio_id })
    const { data, error } = await supabase.from('visitas').insert({
      usuario_id, gimnasio_id, fecha: new Date().toISOString()
    }).select()
    if (error) console.error('[visitService.add] error:', error.message, error)
    else console.log('[visitService.add] inserted row:', data)
    return error ? { error: error.message } : { ok: true }
  },
  async _gymNames(ids) {
    if (!ids.length) return {}
    const { data } = await supabase.from('gimnasios').select('id, nombre').in('id', ids)
    const map = {}
    ;(data || []).forEach(g => { map[g.id] = g.nombre })
    return map
  },
  async getByUser(usuario_id) {
    console.log('[visitService.getByUser] uid:', usuario_id)
    const { data, error } = await supabase
      .from('visitas')
      .select('id, fecha, gimnasio_id')
      .eq('usuario_id', usuario_id)
      .order('fecha', { ascending: false })
      .limit(50)
    if (error) { console.error('[visitService.getByUser] error:', error.message, error); return [] }
    console.log('[visitService.getByUser] rows:', data?.length ?? 0)
    const gymNames = await visitService._gymNames([...new Set((data || []).map(v => v.gimnasio_id).filter(Boolean))])
    return (data || []).map(v => ({
      id: v.id,
      gym: gymNames[v.gimnasio_id] || '—',
      date: new Date(v.fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: new Date(v.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      rawDate: v.fecha,
    }))
  },
  async getToday() {
    const start = new Date(); start.setHours(0, 0, 0, 0)
    const { data, error } = await supabase
      .from('visitas')
      .select('id, fecha, usuario_id, gimnasio_id')
      .gte('fecha', start.toISOString())
      .order('fecha', { ascending: false })
    if (error) { console.error('[visitService.getToday] error:', error.message); return [] }
    const gymNames = await visitService._gymNames([...new Set((data || []).map(v => v.gimnasio_id).filter(Boolean))])
    return (data || []).map(v => ({
      id: v.id,
      gym: gymNames[v.gimnasio_id] || '—',
      time: new Date(v.fecha).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
      usuario_id: v.usuario_id,
    }))
  },
  async getMonthCount() {
    const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0)
    const { count } = await supabase
      .from('visitas')
      .select('*', { count: 'exact', head: true })
      .gte('fecha', start.toISOString())
    return count || 0
  },
  async getTotal() {
    const { count } = await supabase
      .from('visitas')
      .select('*', { count: 'exact', head: true })
    return count || 0
  },
}

export const userService = {
  async getPlan(userId) {
    const { data } = await supabase.from('usuarios').select('plan').eq('id', userId).single()
    return data?.plan || 'estandar'
  },
  async updatePlan(userId, plan) {
    const { error } = await supabase.from('usuarios').upsert({ id: userId, plan })
    return error ? { error: error.message } : { ok: true }
  }
}

export const ratingService = {
  async add(usuario_id, gimnasio_id, estrellas, comentario) {
    const { error } = await supabase.from('calificaciones').insert({
      usuario_id, gimnasio_id, estrellas, comentario, fecha: new Date().toISOString()
    })
    return error ? { error: error.message } : { ok: true }
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
