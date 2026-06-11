'use client'

import {
  createContext,
  useContext,
  useMemo,
  useState,
} from 'react'

export type CartItem = {
  id: string

  productId: string
  productName: string
  imageUrl?: string

  selectedModifiers: {
    groupCode: string
    groupName?: string
    optionId: string
    optionName?: string
    dependsOnOptionId?: string
    quantity?: number
    fraction?: number
    unitPriceDelta?: number
    totalDelta?: number
  }[]

  displayGroups: {
    code: string
    name: string
    options: Array<{
      name: string
      fraction?: number
      price?: number
    }>
  }[]

  additionalItems?: {
    productId: string
    name: string
    price: number
  }[]

  quantity: number

  unitPrice: number
  totalPrice: number

  notes?: string
}

type CartContextData = {
  items: CartItem[]

  addItem: (item: CartItem) => void
  removeItem: (id: string) => void

  increaseQuantity: (id: string) => void
  decreaseQuantity: (id: string) => void

  removeFlavor: (itemId: string, flavorIndex: number) => void
  removeBorder: (itemId: string) => void
  removeAdditionalItem: (itemId: string, additionalIndex: number) => void

  clearCart: () => void

  totalItems: number
  totalPrice: number
  hasItems: boolean
}

const CartContext = createContext<CartContextData | null>(null)

function recalculateItemTotal(item: CartItem) {
  const additionalTotal = (item.additionalItems ?? []).reduce(
    (total, additional) => total + additional.price,
    0,
  )
  const borderModifierTotal =
    item.selectedModifiers
      .filter((modifier) => modifier.groupCode === 'pizza_border')
      .reduce((total, modifier) => total + (modifier.totalDelta ?? 0), 0)

  return {
    ...item,
    totalPrice: item.unitPrice + borderModifierTotal + additionalTotal,
  }
}

export function CartProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [items, setItems] = useState<CartItem[]>([])

  function addItem(item: CartItem) {
    setItems((prev) => [
      ...prev,
      recalculateItemTotal(item),
    ])
  }

  function removeItem(id: string) {
    setItems((prev) =>
      prev.filter((item) => item.id !== id),
    )
  }

  function increaseQuantity(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    )
  }

  function decreaseQuantity(id: string) {
    setItems((prev) =>
      prev
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    )
  }

  function removeFlavor(
    itemId: string,
    flavorIndex: number,
  ) {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item

        return {
          ...item,
          selectedModifiers: removeFlavorModifier(
            item.selectedModifiers,
            flavorIndex,
          ),
          displayGroups: removeDisplayGroupOption(
            item.displayGroups,
            'pizza_flavor',
            flavorIndex,
          ),
        }
      }),
    )
  }

  function removeBorder(itemId: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? recalculateItemTotal({
              ...item,
              selectedModifiers: item.selectedModifiers.filter(
                (modifier) => modifier.groupCode !== 'pizza_border',
              ),
              displayGroups: item.displayGroups.filter(
                (group) => group.code !== 'pizza_border',
              ),
            })
          : item,
      ),
    )
  }

  function removeAdditionalItem(
    itemId: string,
    additionalIndex: number,
  ) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? recalculateItemTotal({
              ...item,
              additionalItems: (item.additionalItems ?? []).filter(
                (_, index) => index !== additionalIndex,
              ),
            })
          : item,
      ),
    )
  }

  function clearCart() {
    setItems([])
  }

  const totalItems = useMemo(() => {
    return items.reduce(
      (total, item) => total + item.quantity,
      0,
    )
  }, [items])

  const totalPrice = useMemo(() => {
    return items.reduce(
      (total, item) =>
        total + item.totalPrice * item.quantity,
      0,
    )
  }, [items])

  const hasItems = totalItems > 0

  return (
    <CartContext.Provider
      value={{
        items,

        addItem,
        removeItem,

        increaseQuantity,
        decreaseQuantity,

        removeFlavor,
        removeBorder,
        removeAdditionalItem,

        clearCart,

        totalItems,
        totalPrice,
        hasItems,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

function removeFlavorModifier(
  modifiers: CartItem['selectedModifiers'],
  flavorIndex: number,
) {
  let currentFlavorIndex = -1

  return modifiers.filter((modifier) => {
    if (modifier.groupCode !== 'pizza_flavor') {
      return true
    }

    currentFlavorIndex += 1

    return currentFlavorIndex !== flavorIndex
  })
}

function removeDisplayGroupOption(
  groups: CartItem['displayGroups'],
  groupCode: string,
  optionIndex: number,
) {
  return groups
    .map((group) =>
      group.code === groupCode
        ? {
            ...group,
            options: group.options.filter((_, index) => index !== optionIndex),
          }
        : group,
    )
    .filter((group) => group.options.length > 0)
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error(
      'useCart precisa estar dentro do CartProvider',
    )
  }

  return context
}
