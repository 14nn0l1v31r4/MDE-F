type GuidanceItem = {
  title: string;
  whenUse: string;
  recommendedColumns: string[];
  avoidColumns: string[];
  interpretation: string;
};

const guidanceItems: GuidanceItem[] = [
  {
    title: "Análise Estatística",
    whenUse:
      "Use quando quiser entender a composição geral da base, verificar distribuições, valores ausentes e relações entre categorias.",
    recommendedColumns: [
      "sexo",
      "cor_ou_raca",
      "renda_mensal_familia",
      "forma_de_ingresso",
      "cidade_candidato",
      "uf_candidato",
      "turno",
      "semestre",
      "grande_area_do_curso",
    ],
    avoidColumns: [
      "nome",
      "cpf",
      "matricula",
      "id interno",
      "telefone",
      "endereço",
    ],
    interpretation:
      "Comece por ela antes das análises avançadas. Ela ajuda a validar se a base está consistente e se as colunas escolhidas fazem sentido.",
  },
  {
    title: "Clusterização KMeans",
    whenUse:
      "Use quando quiser separar os registros em grupos de perfis semelhantes.",
    recommendedColumns: [
      "renda_mensal_familia",
      "faixa_etaria",
      "forma_de_ingresso",
      "escola_publica",
      "turno",
      "grande_area_do_curso",
      "atividade_remunerada",
    ],
    avoidColumns: [
      "nome",
      "cpf",
      "matricula",
      "id",
      "colunas sem significado analítico",
      "colunas com muitos valores únicos",
    ],
    interpretation:
      "Os clusters são agrupamentos matemáticos. Eles não representam categorias oficiais, mas indicam perfis semelhantes encontrados nos dados.",
  },
  {
    title: "Clusterização DBSCAN",
    whenUse:
      "Use quando quiser encontrar grupos por densidade e identificar registros que podem ser classificados como ruído.",
    recommendedColumns: [
      "faixa_etaria",
      "renda_mensal_familia",
      "atividade_remunerada",
      "turno",
      "forma_de_ingresso",
      "escola_publica",
    ],
    avoidColumns: [
      "texto livre",
      "muitas colunas categóricas ao mesmo tempo",
      "cidade sem agrupamento",
      "identificadores",
    ],
    interpretation:
      "Se aparecer muito ruído, pode ser sinal de que as colunas escolhidas não representam bem proximidade entre registros ou que os parâmetros precisam de ajuste.",
  },
  {
    title: "Isolation Forest",
    whenUse:
      "Use quando quiser localizar registros incomuns ou diferentes do comportamento geral da base.",
    recommendedColumns: [
      "faixa_etaria",
      "renda_mensal_familia",
      "forma_de_ingresso",
      "escola_publica",
      "atividade_remunerada",
      "turno",
      "grande_area_do_curso",
    ],
    avoidColumns: [
      "nome",
      "cpf",
      "matricula",
      "id",
      "telefone",
      "identificadores pessoais",
    ],
    interpretation:
      "Uma anomalia não significa necessariamente erro. Pode representar um caso raro, uma inconsistência ou um perfil específico que merece verificação.",
  },
  {
    title: "Regras de Associação",
    whenUse:
      "Use quando quiser descobrir relações frequentes entre categorias da base.",
    recommendedColumns: [
      "sexo",
      "cor_ou_raca",
      "renda_mensal_familia",
      "forma_de_ingresso",
      "escola_publica",
      "turno",
      "atividade_remunerada",
      "participa_economia_familiar",
      "grande_area_do_curso",
    ],
    avoidColumns: [
      "colunas numéricas contínuas sem agrupamento",
      "texto livre",
      "nome",
      "cpf",
      "matricula",
      "identificadores pessoais",
    ],
    interpretation:
      "Priorize regras com bom equilíbrio entre suporte, confiança e lift. A regra indica associação estatística, não causalidade.",
  },
];

type Props = {
  compact?: boolean;
};

export function AnalysisGuidance({ compact = false }: Props) {
  const visibleItems = compact ? guidanceItems.slice(0, 3) : guidanceItems;

  return (
    <section className={compact ? "analysis-guidance compact" : "analysis-guidance"}>
      <div className="subsection-heading">
        <span>Orientações de análise</span>
        <p>
          Clique em uma técnica para ver quando usar, quais colunas selecionar,
          quais evitar e como interpretar o resultado.
        </p>
      </div>

      <div className="analysis-guidance-grid">
        {visibleItems.map((item) => (
          <details
            className="analysis-guidance-card collapsible-card"
            key={item.title}
          >
            <summary className="collapsible-summary">
              <div>
                <h3>{item.title}</h3>
                <p>{item.whenUse}</p>
              </div>

              <span className="summary-label summary-label-open">
                Ver detalhes
              </span>

              <span className="summary-label summary-label-close">
                Ocultar
              </span>
            </summary>

            <div className="collapsible-content">
              <div className="guidance-block">
                <strong>Colunas recomendadas</strong>

                <div className="column-chip-list">
                  {item.recommendedColumns.map((column) => (
                    <span className="column-chip" key={column}>
                      {column}
                    </span>
                  ))}
                </div>
              </div>

              <div className="guidance-block">
                <strong>Evite</strong>

                <div className="column-chip-list">
                  {item.avoidColumns.map((column) => (
                    <span className="column-chip column-chip-danger" key={column}>
                      {column}
                    </span>
                  ))}
                </div>
              </div>

              {!compact && (
                <div className="guidance-block guidance-interpretation">
                  <strong>Como interpretar</strong>
                  <p>{item.interpretation}</p>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>

      {compact && (
        <p className="analysis-guidance-note">
          Para ver todas as recomendações, acesse a tela{" "}
          <strong>Guia de Usuário</strong>.
        </p>
      )}
    </section>
  );
}