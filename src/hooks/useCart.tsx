import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      await api.get(`stock/${productId}`).then(response => {
        const amount = response.data.amount;
        if (amount === 0) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
      })

      const updatedCart = [...cart]; // qualquer alteracao no novo array updatedCart não refletira no array cart
      const productExist = updatedCart.find(i => i.id === productId)
      
      if (productExist) {
        productExist.amount = productExist.amount + 1; // qualquer alteracao no productExist reflete no updatedCart
      } else {
        await api.get(`products/${productId}`).then(response => {
            const newProduct = response.data;
            newProduct.amount = 1
            updatedCart.push(newProduct);
          })     
      }
      setCart(updatedCart)  
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart))    
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
