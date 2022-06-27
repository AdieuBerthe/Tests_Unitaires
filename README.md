# Projet 2 : Tests Unitaires
---

Pour cet exercice sur les tests unitaires cumulant un assez grand nombre de tests, j'ai décidé d'utiliser sept describes afin de rendre l'ensemble plus lisible et aéré, me permettant également d'accélerer le déroulement des tests en utilisant describe.only.

---

## I - Setters/Getters : 6 tests

- On enregistre un voter dans le mapping et on verifie isRegistered
- On enregistre une proposal dans l'array et on vérifie sa déscription
- Après un vote, on vérifie que le hasVoted du votant
- On vérifie ensuite son vote
- On vérifie le voteCount de la proposal
- On vérifie qu'après le comptage le winningProposalID est bien l'id du gagnant
---

## II - Events & WorkflowStatus : 14 tests

Voulant être exhaustif et pour limiter la redondance de code (déjà bien présente) j'ai décidé de mêler le test des events et celui du WorkflowStatus (WfS) dans un describe.

- Vérification du WfS par défaut
- Event : Enregistrement d'un voter
- Event : le nouveau WfS est l'enregistrement des proposals
- Vérification du nouveau WfS
- Event : Proposition enregistrée
- Event : le nouveau WfS est la fin d'enregistrement des proposals
- Vérification du nouveau WfS
- Event : le nouveau WfS est le début de la session de vote
- Vérification du nouveau WfS
- Event : Vote soumis
- Event : le nouveau WfS est la fin de la session de vote
- Vérification du nouveau WfS
- Event : le nouveau WfS est la comptabilisation des votes
- Vérification du WfS final
---

## III - Requires & Reverts

Pour tester les requires et les reverts j'ai décidé de diviser en cinq describes : Le WorkflowStatus, l'enregistrement des voters, l'enregistrement des proposals, le vote et le tally. Pour l'exercice, j'ai décidé d'utiliser le beforeEach pour cette catégorie, à l'exception du WorkflowStatus.

### 1 - WorkflowStatus : 20 tests

On vérifie globalement que toutes les fonctions de changement de workflow revert lorsque le WfS n'est pas celui attendu. 

*Quand nous sommes à RegisteringVoters, on attend les reverts de :*

- endProposalsRegistering()
- startVotingSession()
- endVotingSession()

*Puis à ProposalsRegistrationStarted, on attend les reverts de :*

- startProposalsRegistering()
- startVotingSession()
- endVotingSession()

*Ensuite à ProposalsRegistrationEnded, on attend les reverts de :*

- startProposalsRegistering()
- endProposalsRegistering()
- endVotingSession()

*Pendant VotingSessionStarted, on attend les reverts de :*

- startProposalsRegistering()
- endProposalsRegistering()
- startVotingSession()

*Arrivés à VotingSessionEnded, on attend les reverts de :*

- startProposalsRegistering()
- endProposalsRegistering()
- startVotingSession()
- endVotingSession()

*Enfin, après tallyVotes(), on attend les reverts de :*

- startProposalsRegistering()
- endProposalsRegistering()
- startVotingSession()
- endVotingSession()

### 2 - Enregistrement des voters : 7 tests

On va ici attendre le revert de addVoter() dans tous les cas de figure, on en profite pour tester ici le modifier onlyVoter :

- Avec onlyVoter si l'owner ne s'est pas enregistré
- Si le voter est déjà enregistré
- Avec le WfS ProposalsRegistrationStarted
- Avec le WfS ProposalsRegistrationEnded
- Avec le WfS VotingSessionStarted
- Avec le WfS VotingSessionEnded
- Avec le WfS VotesTallied

### 3 - Enregistrement des proposals : 6 tests

Comme pour addVoter(), on attend le revert de addProposal() dans les conditions suivantes :

- Avec une proposal nulle
- Avec le WfS RegisteringVoters
- Avec le WfS ProposalsRegistrationEnded
- Avec le WfS VotingSessionStarted
- Avec le WfS VotingSessionEnded
- Avec le WfS VotesTallied

### 4 - Vote : 7 tests

setVote() doit revert :

- Si le voter a déjà voté
- Si la proposition du vote n'existe pas
- Avec le WfS RegisteringVoters
- Avec le WfS ProposalsRegistrationStarted
- Avec le WfS ProposalsRegistrationEnded
- Avec le WfS VotingSessionEnded
- Avec le WfS VotesTallied

### 5 - tallyVotes : 5 tests

tallyVotes() doit revert :

- Avec le WfS RegisteringVoters
- Avec le WfS ProposalsRegistrationStarted
- Avec le WfS ProposalsRegistrationEnded
- Avec le WfS VotingSessionStarted
- Avec le WfS VotesTallied

## Total : 65 tests

*En espérant ne pas avoir overkill les tests...*