// 

import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { useProduct } from 'vtex.product-context';
import styles from './styles.css';

interface LogisticsInfo {
  slas: SLA[]
}

interface SLA {
  id: string
  name: string
  price: number
  shippingEstimate: string
}

interface SimulationResponse {
  logisticsInfo: LogisticsInfo[]
}

interface SimulationItem {
  id: string
  quantity: number
  seller: string
}

export default function ShippingSimulatorApp() {
  const [postalCode, setPostalCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [shippingOptions, setShippingOptions] = useState<SLA[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Captura as informações do produto da PDP através do contexto nativo da VTEX
  const productContext = useProduct();

  // Cláusula de guarda (guard clause) protege erros de tela se informações do produto ainda não foram carregadas
  if (!productContext || !productContext.selectedItem) {
    return null;
  }

  const selectedSkuId = productContext.selectedItem.itemId;

  // Caso de Borda: Limpar as opções de frete se o usuário mudar de SKU (tamanho/cor) na página
  useEffect(() => {
    setShippingOptions([]);
    setSelectedOptionId(null);
    setError(null);
  }, [selectedSkuId]);

  const selectedQuantity = productContext.selectedQuantity ?? 1;

  // Cria máscara (00000-000) e protege para que sejam inseridos apenas 8 dígitos
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    if (rawValue.length <= 8) {
      setPostalCode(rawValue.replace(/^(\d{5})(\d)/, '$1-$2'));
    }
  }

  const handleFormSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanCep = postalCode.replace(/\D/g, '');

    if (cleanCep.length !== 8) {
      setError('Por gentileza, insira um CEP válido com 8 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);
    setShippingOptions([]);
    setSelectedOptionId(null);

    try {
      // Busca de forma segura os dados do carrinho ativo direto no escopo global injetado pela VTEX
      const vtexContext = (window as any).__ORDER_FORM_CONTEXT__;
      const orderForm = vtexContext?.orderForm;

      // Inicializa a lista de simulação com os itens existentes no carrinho
      let combinedItems: SimulationItem[] = orderForm?.items?.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        seller: item.seller || '1'
      })) || [];

      // Caso de Borda: Verifica se o produto da PDP já existe no carrinho para somar a quantidade
      const existingItemIndex = combinedItems.findIndex(item => item.id === selectedSkuId);

      if (existingItemIndex !== -1) {
        combinedItems[existingItemIndex].quantity += selectedQuantity;
      } else {
        combinedItems.push({
          id: selectedSkuId,
          quantity: selectedQuantity,
          seller: '1'
        });
      }

      // Consumindo a API pública de simulação fornecida pela documentação da VTEX
      const response = await fetch('/api/checkout/pub/orderForms/simulation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: combinedItems,
          postalCode: cleanCep,
          country: 'BRA'
        })
      });

      if (!response.ok) throw new Error();

      const data: SimulationResponse = await response.json();

      // Caso de Borda: Verifica se a estrutura de logística da VTEX veio nula ou vazia
      if (!data.logisticsInfo || data.logisticsInfo.length === 0) {
        setError('CEP não encontrado. Por gentileza, verifique os números digitados.');
        return;
      }

      // Busca os dados logísticos consolidados do grupo de itens avaliados
      const currentItemLogistics = data.logisticsInfo[0];
      const slas = currentItemLogistics?.slas || [];

      // Se a lista estiver vazia após o cruzamento de dados, o produto está indisponível regionalmente
      if (slas.length === 0) {
        setError('Este produto encontra-se indisponível para a sua região ou sem estoque.');
      } else {
        setShippingOptions(slas);
      }
    } catch (err) {
      setError('Ocorreu um erro ao simular o frete. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const formatEstimate = (estimate: string) => {
    const time = estimate.replace(/\D/g, '');
    if (estimate.includes('bd')) return `${time} dias úteis`;
    if (estimate.includes('d')) return `${time} dias`;
    return `${time} dias`;
  };

  const formatPrice = (price: number) => {
    if (price === 0) return 'Grátis';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: "BRL",
    }).format(price / 100);
  }

  return (
    <div className={styles.simulatorContainer}>
      <h3 className={styles.simulatorTitle}>Simule o Frete</h3>

      <form onSubmit={handleFormSubmit} className={styles.simulatorForm}>
        <input
          type="text"
          placeholder="00000-000"
          value={postalCode}
          onChange={handleInputChange}
          className={styles.simulatorInput}
          aria-label="Digitar CEP para simulação de frete"
        />
        <button type="submit" disabled={loading} className={styles.simulatorButton}>
          {loading ? 'Calculando...' : 'Calcular'}
        </button>
      </form>

      {error && <p className={styles.simulatorError} role="alert">{error}</p>}

      {shippingOptions.length > 0 && (
        <div className={styles.shippingWrapper}>
          <p className={styles.shippingInstructions}>Selecione uma opção de entrega:</p>
          <ul className={styles.shippingList} role="radiogroup" aria-label="Opções de frete disponíveis">
            {shippingOptions.map((option) => {
              const isChecked = selectedOptionId === option.id;

              return (
                <li
                  key={option.id}
                  className={`${styles.shippingItem} ${isChecked ? styles.shippingItemActive : ''}`}
                >
                  <label className={styles.shippingLabel}>
                    <input
                      type="radio"
                      name="shippingOption"
                      value={option.id}
                      checked={isChecked}
                      onChange={() => setSelectedOptionId(option.id)}
                      className={styles.shippingRadio}
                    />
                    <div className={styles.shippingInfo}>
                      <span className={styles.shippingName}>{option.name}</span>
                      <span className={styles.shippingEstimate}>
                        Até {formatEstimate(option.shippingEstimate)}
                      </span>
                    </div>
                  </label>
                  <span className={styles.shippingPrice}>{formatPrice(option.price)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
