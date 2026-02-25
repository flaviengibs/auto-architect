# 🎬 Démonstration Auto-Architect

## Installation et premier test

```bash
# 1. Installer les dépendances
npm install

# 2. Compiler le projet
npm run build

# 3. Tester sur le projet d'exemple
node dist/cli/index.js analyze example-project
```

## Résultat attendu

L'outil va détecter :

### 🚨 Anti-patterns

1. **God Module** : `god-module.ts` a 12 dépendances (trop couplé)
2. **Circular Dependency** : `module-a → module-b → module-c → module-a`

### 💡 Propositions de refactoring

1. **Split Module** : Diviser `god-module` en modules plus petits
   - Réduction complexité : -24%
   - Réduction couplage : -25%
   - Gain maintenabilité : +35%

2. **Break Cycle** : Casser la dépendance circulaire
   - Réduction complexité : -30%
   - Réduction couplage : -40%
   - Gain maintenabilité : +45%

## Générer des diagrammes

```bash
# Diagramme Mermaid (visualisable sur GitHub)
node dist/cli/index.js analyze example-project --diagram mermaid

# Diagramme DOT (pour Graphviz)
node dist/cli/index.js analyze example-project --diagram dot
```

Le diagramme Mermaid montre visuellement :
- Les modules problématiques en rouge
- Les dépendances entre modules
- La structure globale de l'architecture

## Analyser votre propre projet

```bash
# Analyser n'importe quel projet TypeScript/JavaScript
node dist/cli/index.js analyze /path/to/your/project

# Avec export JSON pour analyse ultérieure
node dist/cli/index.js analyze /path/to/your/project --output analysis.json
```

## Ce que l'outil analyse

✅ **Métriques d'architecture**
- Nombre total de modules
- Dépendances moyennes/max par module
- Complexité cyclomatique
- Taux de couplage et cohésion

✅ **Anti-patterns détectés**
- God modules (modules trop centraux)
- Dépendances circulaires
- Couplage fort (tight coupling)

✅ **Propositions intelligentes**
- Extraction de services
- Division de modules
- Fusion de modules
- Cassage de cycles

✅ **Visualisation**
- Diagrammes Mermaid
- Diagrammes DOT/Graphviz
- Export JSON pour outils tiers

## Pourquoi c'est impressionnant pour un recruteur

1. **Analyse statique avancée** : Parsing AST et extraction de dépendances
2. **Algorithmes sur graphes** : Détection de cycles, calcul de centralité
3. **Métriques software** : Coupling, cohesion, complexité cyclomatique
4. **Tooling professionnel** : CLI avec couleurs, exports multiples
5. **Vision architecture** : Propositions concrètes avec impact chiffré

C'est exactement le type d'outil interne utilisé chez Google, Amazon, Meta pour maintenir la qualité du code à grande échelle.
