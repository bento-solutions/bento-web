import type { Category } from '@/domain/types'

export const CategoryPill = ({ category }: { category: Pick<Category, 'name' | 'tone'> | null }) =>
  category ? <span className={`pill tone-${category.tone}`}>{category.name}</span> : null
