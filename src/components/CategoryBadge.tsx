import { getCategoryById } from '@/lib/categories'

interface CategoryBadgeProps {
  categoryId: string
  size?: 'sm' | 'md'
}

export default function CategoryBadge({ categoryId, size = 'md' }: CategoryBadgeProps) {
  const category = getCategoryById(categoryId)
  if (!category) return null

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5'
    : 'text-xs px-2.5 py-1'

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-mono font-semibold tracking-wider uppercase border ${sizeClasses} ${category.color} ${category.bgColor} ${category.borderColor}`}
    >
      <span className="text-xs leading-none">{category.emoji}</span>
      {category.label}
    </span>
  )
}
