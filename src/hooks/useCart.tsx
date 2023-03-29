import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
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
  
  const prevCartRef = useRef<Product[]>();

  useEffect(() => {
    prevCartRef.current = cart;
  });

  const previousCart = prevCartRef.current ?? cart;

  useEffect(() => {
    if (previousCart !== cart) {
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(cart));
    }
  }, [cart, previousCart])

  const addProduct = async (productId: number) => {
    try {
      const updatedCart = [...cart]; // qualquer alteracao no novo array updatedCart não refletira no array cart
      const productExist = updatedCart.find(i => i.id === productId)
      
      if (productExist) {
        await api.get(`stock/${productId}`).then(response => {
          const amount = response.data.amount;

          if (productExist.amount >= amount) {
            toast.error('Quantidade solicitada fora de estoque');
            return;
          }
          productExist.amount += 1; // qualquer alteracao no productExist reflete no updatedCart
        })
      } else {
        await api.get(`products/${productId}`).then(response => {
            const newProduct = response.data;
            newProduct.amount = 1
            updatedCart.push(newProduct);
          })     
      }
      setCart(updatedCart);
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const updatedCart = [...cart]; // qualquer alteracao no novo array updatedCart não refletira no array cart
      const productIndex = updatedCart.findIndex(i => {return i.id === productId});
      if (productIndex === -1) {
        throw Error();
      }
      updatedCart.splice(productIndex, 1);
      setCart(updatedCart);
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      await api.get(`stock/${productId}`).then(response => {
        const amountStock = response.data.amount;
        if (amount > amountStock) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        const updatedCart = [...cart]; // qualquer alteracao no novo array updatedCart não refletira no array cart
        const productIndex = updatedCart.findIndex(i => {return i.id === productId})
        if (productIndex === -1) {
          throw Error();
        }
        updatedCart[productIndex].amount = amount;
        setCart(updatedCart);
      })   
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
