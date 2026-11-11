import { useContext } from 'react'
import AppDataContext from '../context/appData.js'

export function useAppData() {
  const value = useContext(AppDataContext)
  if (!value) throw new Error('useAppData must be used within AppDataProvider')
  return value
}
