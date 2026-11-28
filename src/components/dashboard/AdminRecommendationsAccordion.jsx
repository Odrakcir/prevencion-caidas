import { useState, useEffect } from "react";
import { useIsDesktop } from "../../hooks/useDesktop";

export default function AdminRecommendationsAccordion({
  recommendations = [],
  onToggleApplied,
}) {
  const isDesktop = useIsDesktop();

  // Agrupamos las recomendaciones de Supabase por tipo_recomendacion
  const groupedCategories = Object.values(
    recommendations.reduce((acc, rec) => {
      const category = (rec.tipo_recomendacion || "General").trim();
      if (!acc[category]) {
        acc[category] = { name: category, items: [] };
      }
      acc[category].items.push(rec);
      return acc;
    }, {}),
  );

  // Por defecto abrimos solo la primera categoría para evitar listas largas
  const firstCategoryName = groupedCategories[0]?.name || null;
  const [openCategory, setOpenCategory] = useState(firstCategoryName);

  // Si cambia el participante o el listado y la categoría abierta ya no existe, ajustamos
  useEffect(() => {
    setOpenCategory((prev) => {
      if (prev && groupedCategories.some((c) => c.name === prev)) return prev;
      return firstCategoryName;
    });
  }, [firstCategoryName, recommendations.length]);

  if (!recommendations || recommendations.length === 0) return null;

  const totalCount = recommendations.length;
  const appliedCount = recommendations.filter((r) => r.estado_aplicada).length;
  const progressPct = Math.round((appliedCount / totalCount) * 100);

  const handleToggleCategory = (name) => {
    setOpenCategory((prev) => (prev === name ? null : name));
  };

  return (
    <div
      style={{
        backgroundColor: "#FFFFFF",
        border: "1px solid #E2E8F0",
        borderRadius: "14px",
        padding: isDesktop ? "22px" : "16px",
        marginBottom: "20px",
        boxShadow: "0 1px 3px rgba(15, 23, 42, 0.05)",
      }}
    >
      {/* Cabecera + contador de avance */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: isDesktop ? "center" : "flex-start",
          flexDirection: isDesktop ? "row" : "column",
          gap: "10px",
          marginBottom: "14px",
        }}
      >
        <div>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "800",
              color: "#0F172A",
              margin: "0 0 4px 0",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              letterSpacing: "-0.01em",
            }}
          >
            <span
              style={{
                display: "inline-block",
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#0F766E",
                flexShrink: 0,
              }}
            />
            Plan de Acción Generado
          </h3>
          <p
            style={{
              fontSize: "14px",
              color: "#475569",
              margin: 0,
              lineHeight: "1.45",
            }}
          >
            Adaptaciones registradas en Supabase agrupadas por categoría. Toca
            cada tarjeta para marcar si ya fue aplicada.
          </p>
        </div>

        <span
          style={{
            fontSize: "13px",
            fontWeight: "700",
            color: appliedCount === totalCount ? "#065F46" : "#0F766E",
            backgroundColor:
              appliedCount === totalCount ? "#ECFDF5" : "#F0FDFA",
            border: "1px solid #99F6E4",
            padding: "5px 12px",
            borderRadius: "999px",
            whiteSpace: "nowrap",
          }}
        >
          {appliedCount} de {totalCount} aplicadas
        </span>
      </div>

      {/* Barra de progreso */}
      <div style={{ marginBottom: "16px" }}>
        <div
          style={{
            width: "100%",
            height: "7px",
            backgroundColor: "#E2E8F0",
            borderRadius: "999px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${progressPct}%`,
              height: "100%",
              backgroundColor:
                appliedCount === totalCount ? "#059669" : "#0F766E",
              borderRadius: "999px",
              transition: "width 0.25s ease",
            }}
          />
        </div>
      </div>

      {/* Acordeón por categoría */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {groupedCategories.map((cat) => {
          const isOpen = openCategory === cat.name;
          const catApplied = cat.items.filter((i) => i.estado_aplicada).length;
          const allCatApplied = catApplied === cat.items.length;
          const panelId = `admin-rec-panel-${cat.name.toLowerCase().replace(/\s+/g, "-")}`;

          return (
            <div
              key={cat.name}
              style={{
                border: isOpen ? "2px solid #0F766E" : "1.5px solid #CBD5E1",
                borderRadius: "12px",
                overflow: "hidden",
                backgroundColor: "#FFFFFF",
                transition: "border-color 0.15s ease",
              }}
            >
              {/* Botón de categoría */}
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => handleToggleCategory(cat.name)}
                style={{
                  width: "100%",
                  minHeight: "54px",
                  padding: isDesktop ? "12px 16px" : "12px 14px",
                  backgroundColor: isOpen ? "#F0FDFA" : "#F8FAFC",
                  border: "none",
                  borderBottom: isOpen ? "1px solid #CCFBF1" : "none",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "8px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "16px",
                      fontWeight: "800",
                      color: isOpen ? "#0F766E" : "#0F172A",
                    }}
                  >
                    {cat.name}
                  </span>
                  <span
                    style={{
                      fontSize: "12.5px",
                      fontWeight: "700",
                      backgroundColor: allCatApplied ? "#DCFCE7" : "#FEF3C7",
                      color: allCatApplied ? "#065F46" : "#92400E",
                      padding: "2px 10px",
                      borderRadius: "999px",
                    }}
                  >
                    {cat.items.length}{" "}
                    {cat.items.length === 1
                      ? "recomendación"
                      : "recomendaciones"}
                  </span>
                  {catApplied > 0 && (
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "700",
                        color: "#065F46",
                      }}
                    >
                      ({catApplied}/{cat.items.length} aplicadas)
                    </span>
                  )}
                </div>

                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "13px",
                    fontWeight: "700",
                    color: isOpen ? "#0F766E" : "#475569",
                    flexShrink: 0,
                  }}
                >
                  <span>{isOpen ? "Ocultar" : "Ver"}</span>
                  <span style={{ fontSize: "15px" }}>{isOpen ? "▴" : "▾"}</span>
                </span>
              </button>

              {/* Contenido desplegable en grilla de 2 columnas en escritorio */}
              {isOpen && (
                <div
                  id={panelId}
                  role="region"
                  aria-label={`Recomendaciones de ${cat.name}`}
                  style={{
                    padding: isDesktop ? "14px 16px" : "12px",
                    display: "grid",
                    gridTemplateColumns:
                      isDesktop && cat.items.length > 1
                        ? "repeat(2, minmax(0, 1fr))"
                        : "1fr",
                    gap: "10px",
                    backgroundColor: "#FFFFFF",
                  }}
                >
                  {cat.items.map((rec) => {
                    const isApplied = Boolean(rec.estado_aplicada);
                    const dateLabel = rec.fecha_generacion
                      ? new Date(rec.fecha_generacion).toLocaleDateString(
                          "es-CL",
                        )
                      : null;

                    return (
                      <button
                        key={rec.id_recomendacion}
                        type="button"
                        role="checkbox"
                        aria-checked={isApplied}
                        onClick={() => onToggleApplied?.(rec)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          padding: "13px 14px",
                          borderRadius: "10px",
                          border: isApplied
                            ? "1.5px solid #10B981"
                            : "1.5px solid #E2E8F0",
                          borderLeft: isApplied
                            ? "5px solid #059669"
                            : "5px solid #0F766E",
                          backgroundColor: isApplied ? "#F0FDF4" : "#F8FAFC",
                          cursor: onToggleApplied ? "pointer" : "default",
                          transition: "all 0.15s ease",
                        }}
                      >
                        <span
                          aria-hidden="true"
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "6px",
                            border: isApplied
                              ? "2px solid #059669"
                              : "2px solid #64748B",
                            backgroundColor: isApplied ? "#059669" : "#FFFFFF",
                            color: "#FFFFFF",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "14px",
                            fontWeight: "800",
                            flexShrink: 0,
                            marginTop: "2px",
                          }}
                        >
                          {isApplied ? "✓" : ""}
                        </span>

                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              flexWrap: "wrap",
                              gap: "6px",
                              marginBottom: "6px",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "11.5px",
                                fontWeight: "700",
                                color: isApplied ? "#065F46" : "#92400E",
                                backgroundColor: isApplied
                                  ? "#DCFCE7"
                                  : "#FEF3C7",
                                padding: "2px 8px",
                                borderRadius: "6px",
                              }}
                            >
                              {isApplied ? "Aplicada" : "Pendiente"}
                            </span>
                            {dateLabel && (
                              <span
                                style={{
                                  fontSize: "11.5px",
                                  fontWeight: "600",
                                  color: "#64748B",
                                }}
                              >
                                {dateLabel}
                              </span>
                            )}
                          </span>

                          <span
                            style={{
                              display: "block",
                              fontSize: "14.5px",
                              color: "#0F172A",
                              fontWeight: "500",
                              lineHeight: "1.5",
                              textDecoration: isApplied
                                ? "line-through"
                                : "none",
                              opacity: isApplied ? 0.8 : 1,
                            }}
                          >
                            {rec.descripcion}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
