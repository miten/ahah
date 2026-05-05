import { useState, useRef, useEffect, useCallback } from "react";

const initialCards = [
    { title: "Architecture moderne", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" },
    { title: "Forêt boréale", background: "linear-gradient(135deg, #134e5e 0%, #1a6b3c 60%, #2d8a4e 100%)" },
    { title: "Désert de feu", background: "linear-gradient(135deg, #b45309 0%, #d97706 50%, #fbbf24 100%)" },
    { title: "Océan profond", background: "linear-gradient(135deg, #0c4a6e 0%, #0369a1 50%, #0ea5e9 100%)" },
    { title: "Aurore boréale", background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4c1d95 70%, #065f46 100%)" },
    { title: "Volcan actif", background: "linear-gradient(135deg, #1c0d00 0%, #7c1d0b 50%, #dc2626 100%)" },
];

// Structure: [CloneDernière, 1, 2, 3, 4, 5, 6, ClonePremière]
const extendedCards = [
    initialCards[initialCards.length - 1],
    ...initialCards,
    initialCards[0]
];

const GAP = 20;
// La durée CSS doit correspondre à la logique JS
const TRANSITION_DURATION_CSS = '0.45s';

export default function CardSlider() {
    // On commence à l'index 1 (la vraie première carte)
    const [current, setCurrent] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [cardWidth, setCardWidth] = useState(0);
    const [sideVisible, setSideVisible] = useState(0);

    const viewportRef = useRef(null);
    const isMovingRef = useRef(false); // Remplace animatingRef pour plus de clarté
    const n = extendedCards.length;

    const updateDimensions = useCallback(() => {
        if (!viewportRef.current) return;
        const vw = viewportRef.current.offsetWidth;
        // Largeur responsive de la carte
        const cw = vw * 0.72;
        // Calcul pour centrer la carte active et voir les côtés
        const side = (vw - cw - GAP * 2) / 2;
        setCardWidth(cw);
        setSideVisible(side);
    }, []);

    useEffect(() => {
        updateDimensions();
        window.addEventListener("resize", updateDimensions);
        return () => window.removeEventListener("resize", updateDimensions);
    }, [updateDimensions]);

    const go = useCallback((dir) => {
        // Bloque le clic si une animation est en cours
        if (isMovingRef.current) return;

        isMovingRef.current = true;
        // Active la transition CSS pour un mouvement fluide
        setIsTransitioning(true);
        setCurrent((prev) => prev + dir);
    }, []);

    // LA FONCTION CLÉ : Appelée par le navigateur à la fin de la transition CSS
    const handleTransitionEnd = () => {
        isMovingRef.current = false; // Débloque les clics

        // GESTION DU SAUT INVISIBLE (La boucle infinie)

        // 1. Si on est sur le clone de la FIN (index n-1)
        if (current === n - 1) {
            setIsTransitioning(false); // Désactive TOUTE transition CSS
            setCurrent(1); // Saute instantanément sur la VRAIE première carte
        }
        // 2. Si on est sur le clone du DÉBUT (index 0)
        else if (current === 0) {
            setIsTransitioning(false); // Désactive TOUTE transition CSS
            setCurrent(n - 2); // Saute instantanément sur la VRAIE dernière carte
        }
        // Sinon, c'est une transition normale au milieu, on ne fait rien.
    };

    // Calcul de la position X
    const translateX = sideVisible - current * (cardWidth + GAP);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem 0", width: '100%', overflow: 'hidden' }}>

            {/* Viewport */}
            <div ref={viewportRef} style={{ position: "relative", width: "100%", cursor: isMovingRef.current ? 'wait' : 'default' }}>

                {/* Track (Conteneur mobile) */}
                <div
                    // ON ÉCOUTE L'ÉVÉNEMENT ICI
                    onTransitionEnd={handleTransitionEnd}
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: GAP,
                        transform: `translateX(${translateX}px)`,
                        // La transition n'est appliquée QUE si isTransitioning est vrai
                        transition: isTransitioning
                            ? `transform ${TRANSITION_DURATION_CSS} cubic-bezier(0.4, 0, 0.2, 1)`
                            : "none",
                        // Optimisation performance
                        willChange: 'transform',
                    }}
                >
                    {extendedCards.map((card, i) => {
                        // Optimisation pour ne pas rendre l'UI des boutons sur les clones
                        const isRealCard = i > 0 && i < n - 1;
                        const isCenter = current === i;

                        return (
                            <div
                                key={i}
                                style={{
                                    flexShrink: 0,
                                    width: cardWidth,
                                    height: 260,
                                    borderRadius: 20,
                                    background: card.background,
                                    padding: "1.5rem",
                                    boxSizing: "border-box",
                                    display: "flex",
                                    flexDirection: "column",
                                    justifyContent: "flex-end",
                                    // Effet visuel sur les cartes de côté
                                    opacity: isCenter ? 1 : 0.4,
                                    transform: isCenter ? 'scale(1)' : 'scale(0.95)',
                                    transition: `opacity 0.3s, transform 0.3s`,
                                }}
                            >
                                <p style={{
                                    margin: 0,
                                    color: "#fff",
                                    fontSize: 22,
                                    fontWeight: 600,
                                    textShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}>
                                    {card.title}
                                </p>

                                {/* Affichage conditionnel des boutons pour la démo */}
                                {isRealCard && isCenter && (
                                    <div style={{ display: "flex", gap: 10, marginTop: '1rem' }}>
                                        <button onClick={() => go(-1)} style={{padding: '5px 10px', cursor: 'pointer'}}>Précédent</button>
                                        <button onClick={() => go(1)} style={{padding: '5px 10px', cursor: 'pointer'}}>Suivant</button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Dots */}
            <div style={{ display: "flex", gap: 9, marginTop: "1.5rem" }}>
                {initialCards.map((_, i) => {
                    // Logique pour allumer le bon point même quand on est sur un clone
                    const isActive = current === i + 1 || (current === 0 && i === initialCards.length - 1) || (current === n - 1 && i === 0);
                    return (
                        <div key={i} style={{
                            width: isActive ? 8 : 6,
                            height: isActive ? 8 : 6,
                            borderRadius: "50%",
                            background: isActive ? "#555" : "#ccc",
                            transition: "all 0.3s ease",
                            // Aligne les points verticalement si leur taille change
                            transform: 'translateY(-50%)',
                            marginTop: '4px'
                        }} />
                    );
                })}
            </div>
        </div>
    );
}
