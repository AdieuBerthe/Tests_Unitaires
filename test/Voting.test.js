const Voting = artifacts.require("./Voting.sol");
const { BN, expectRevert, expectEvent } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

contract('Voting', accounts => {
    const owner = accounts[0];
    const voter1 = accounts[1];
    const voter2 = accounts[2];
    const voter3 = accounts[3];

    let VotingInstance;

                                    // ::::::::::::: Setters / Getterss ::::::::::::: //

    describe("test des setters/getters", function () {

        before(async function () {
            VotingInstance = await Voting.new({from:owner});
            
        });

        it("store voter, get bool isRegistered", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await VotingInstance.addVoter(voter1, {from: owner});
            await VotingInstance.addVoter(voter2, {from: owner});
            await VotingInstance.addVoter(voter3, {from: owner});
            const storedData = await VotingInstance.getVoter(voter2, {from: owner});
            expect(storedData.isRegistered).to.be.true;
        });

        it("store a proposal, get its description", async () => {
            await VotingInstance.startProposalsRegistering({from:owner});
            await VotingInstance.addProposal("BBQ le vendredi", {from: voter1});
            await VotingInstance.addProposal("Raclette le jeudi", {from: owner});
            await VotingInstance.addProposal("Légumes vapeurs tous les jours", {from: voter2}); 
            const storedData = await VotingInstance.getOneProposal(1, {from: owner});
            expect(storedData.description).to.equal("Raclette le jeudi");
        });

        it("set a vote, get voter bool hasVoted", async () => {
            await VotingInstance.endProposalsRegistering({from:owner});
            await VotingInstance.startVotingSession({from: owner});
            await VotingInstance.setVote(1, {from: voter3});
            const storedData = await VotingInstance.getVoter(voter3, {from: owner});
            expect(storedData.hasVoted).to.be.true;
        });

        it("get voter's vote", async () => {
            const storedData = await VotingInstance.getVoter(voter3, {from: owner});
            expect(new BN(storedData.votedProposalId)).to.be.bignumber.equal(new BN(1));
        });

        it("get proposal voteCount", async () => {
            const storedData = await VotingInstance.getOneProposal(1, {from: owner});
            expect(new BN(storedData.voteCount)).to.be.bignumber.equal(new BN(1));
        });

        it("set votes, use tally, get winning Id", async () => {
            await VotingInstance.setVote(0, {from: owner});
            await VotingInstance.setVote(1, {from: voter1});
            await VotingInstance.setVote(2, {from: voter2});
            await VotingInstance.endVotingSession({from: owner});
            await VotingInstance.tallyVotes({from: owner});
            const storedData = await VotingInstance.winningProposalID();
            expect(new BN(storedData)).to.be.bignumber.equal(new BN(1));
        });
    });

                                // ::::::::::::: Events / WorkflowStatus ::::::::::::: //

    describe("tests des events et du WorkflowStatus", function () {

        before(async function () {
            VotingInstance = await Voting.new({from:owner});
        });

        it("check the default WfS", async () => {
            const state = await VotingInstance.workflowStatus();
            expect(new BN(state)).to.be.bignumber.equal(new BN(Voting.WorkflowStatus.RegisteringVoters));
        });

        it("register a voter, get event Voter Registered", async () => {
            const findEvent = await VotingInstance.addVoter(voter1, { from: owner });
            expectEvent(findEvent,"VoterRegistered" ,{voterAddress: voter1});
        });

        it("change to ProposalsRegistrationStarted, get WorkflowStatusChange event", async () => {
            const findEvent = await VotingInstance.startProposalsRegistering({ from: owner });
            expectEvent(findEvent,"WorkflowStatusChange" , {previousStatus: new BN(Voting.WorkflowStatus.RegisteringVoters), newStatus: new BN(Voting.WorkflowStatus.ProposalsRegistrationStarted)});
        });

        it("check WfS is ProposalsRegistrationStarted", async () => {
            const state = await VotingInstance.workflowStatus();
            expect(new BN(state)).to.be.bignumber.equal(new BN(Voting.WorkflowStatus.ProposalsRegistrationStarted));
        });

        it("add a proposal, get event Proposal Registered", async () => {
            const findEvent = await VotingInstance.addProposal("Des 4 pour tout le monde", { from: voter1 });
            expectEvent(findEvent,"ProposalRegistered" ,{proposalId: new BN(0)});
        });
        
        it("change to ProposalsRegistrationEnded, get WorkflowStatusChange event", async () => {
            const findEvent = await VotingInstance.endProposalsRegistering({ from: owner });
            expectEvent(findEvent,"WorkflowStatusChange" , {previousStatus: new BN(Voting.WorkflowStatus.ProposalsRegistrationStarted), newStatus: new BN(Voting.WorkflowStatus.ProposalsRegistrationEnded)});
        });

        it("check WfS is ProposalsRegistrationEnded", async () => {
            const state = await VotingInstance.workflowStatus();
            expect(new BN(state)).to.be.bignumber.equal(new BN(Voting.WorkflowStatus.ProposalsRegistrationEnded));
        });

        it("change to VotingSessionStarted, get WorkflowStatusChange event", async () => {
            const findEvent = await VotingInstance.startVotingSession({ from: owner });
            expectEvent(findEvent,"WorkflowStatusChange" , {previousStatus: new BN(Voting.WorkflowStatus.ProposalsRegistrationEnded), newStatus: new BN(Voting.WorkflowStatus.VotingSessionStarted)});
        });

        it("check WfS is ProposalsRegistrationVotingSessionStarted", async () => {
            const state = await VotingInstance.workflowStatus();
            expect(new BN(state)).to.be.bignumber.equal(new BN(Voting.WorkflowStatus.VotingSessionStarted));
        });

        it("add a vote, get event Voted", async () => {
            const findEvent = await VotingInstance.setVote(0, { from: voter1 });
            expectEvent(findEvent,"Voted" ,{voter: voter1, proposalId: new BN(0)});
        });

        it("change to VotingSessionEnded, get WorkflowStatusChange event", async () => {
            const findEvent = await VotingInstance.endVotingSession({ from: owner });
            expectEvent(findEvent,"WorkflowStatusChange" , {previousStatus: new BN(Voting.WorkflowStatus.VotingSessionStarted), newStatus: new BN(Voting.WorkflowStatus.VotingSessionEnded)});
        });

        it("check WfS is ProposalsRegistrationVotingSessionEnded", async () => {
            const state = await VotingInstance.workflowStatus();
            expect(new BN(state)).to.be.bignumber.equal(new BN(Voting.WorkflowStatus.VotingSessionEnded));
        });

        it("tally votes, get WorkflowStatusChange event", async () => {
            const findEvent = await VotingInstance.tallyVotes({ from: owner });
            expectEvent(findEvent,"WorkflowStatusChange" , {previousStatus: new BN(Voting.WorkflowStatus.VotingSessionEnded), newStatus: new BN(Voting.WorkflowStatus.VotesTallied)});
        });

        it("check WfS is VotesTallied", async () => {
            const state = await VotingInstance.workflowStatus();
            expect(new BN(state)).to.be.bignumber.equal(new BN(Voting.WorkflowStatus.VotesTallied));
        });


    });

                                    // ::::::::::::: Requires / Reverts ::::::::::::: //

     // ::::::::::::: STATE ::::::::::::: //

    describe("tests des requires et des reverts pour le workflowStatus", function () {
    
        before(async function () {
            VotingInstance = await Voting.new({from:owner});
        });

         it("should revert endProposals while WfS is at RegisteringVoters", async () => {
            await expectRevert(VotingInstance.endProposalsRegistering({from: owner}), "Registering proposals havent started yet");
         });

         it("should revert startVoting while WfS is at RegisteringVoters", async () => {
            await expectRevert(VotingInstance.startVotingSession({from: owner}), "Registering proposals phase is not finished");
         });

         it("should revert endVoting while WfS is at RegisteringVoters", async () => {
            await expectRevert(VotingInstance.endVotingSession({from: owner}), "Voting session havent started yet");
         });

         //Switch to Proposals Registration Started

         it("should revert startProposals while WfS is at ProposalsRegistrationStarted", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await expectRevert(VotingInstance.startProposalsRegistering({from: owner}), "Registering proposals cant be started now");
         });

         it("should revert startVoting while WfS is at ProposalsRegistrationStarted", async () => {
            await expectRevert(VotingInstance.startVotingSession({from: owner}), "Registering proposals phase is not finished");
         });

         it("should revert endVoting while WfS is at ProposalsRegistrationStarted", async () => {
            await expectRevert(VotingInstance.endVotingSession({from: owner}), "Voting session havent started yet");
         });

         //Switch to Proposals Registration Ended

         it("should revert startProposals while WfS is at ProposalsRegistrationEnded", async () => {
            await VotingInstance.endProposalsRegistering({from: owner});
            await expectRevert(VotingInstance.startProposalsRegistering({from: owner}), "Registering proposals cant be started now");
         });

         it("should revert endProposals while WfS is at ProposalsRegistrationEnded", async () => {
            await expectRevert(VotingInstance.endProposalsRegistering({from: owner}), "Registering proposals havent started yet");
         });

         it("should revert endVoting while WfS is at ProposalsRegistrationEnded", async () => {
            await expectRevert(VotingInstance.endVotingSession({from: owner}), "Voting session havent started yet");
         });

         //Switch to Voting Session Started

         it("should revert startProposals while WfS is at VotingSessionStarted", async () => {
            await VotingInstance.startVotingSession({from: owner});
            await expectRevert(VotingInstance.startProposalsRegistering({from: owner}), "Registering proposals cant be started now");
         });

         it("should revert endProposals while WfS is at VotingSessionStarted", async () => {
            await expectRevert(VotingInstance.endProposalsRegistering({from: owner}), "Registering proposals havent started yet");
         });

         it("should revert startVoting while WfS is at VotingSessionStarted", async () => {
            await expectRevert(VotingInstance.startVotingSession({from: owner}), "Registering proposals phase is not finished");
         });

         //Switch to Voting Session Ended

         it("should revert startProposals while WfS is at VotingSessionEnded", async () => {
            await VotingInstance.endVotingSession({from: owner});
            await expectRevert(VotingInstance.startProposalsRegistering({from: owner}), "Registering proposals cant be started now");
         });

         it("should revert endProposals while WfS is at VotingSessionEnded", async () => {
            await expectRevert(VotingInstance.endProposalsRegistering({from: owner}), "Registering proposals havent started yet");
         });

         it("should revert startVoting while WfS is at VotingSessionEnded", async () => {
            await expectRevert(VotingInstance.startVotingSession({from: owner}), "Registering proposals phase is not finished");
         });

         it("should revert endVoting while WfS is at VotingSessionEnded", async () => {
            await expectRevert(VotingInstance.endVotingSession({from: owner}), "Voting session havent started yet");
         });

         // Votes tallied

         it("should revert startProposals while WfS is at VotesTallied", async () => {
            await VotingInstance.tallyVotes({from: owner});
            await expectRevert(VotingInstance.startProposalsRegistering({from: owner}), "Registering proposals cant be started now");
         });

         it("should revert endProposals while WfS is at VotesTallied", async () => {
            await expectRevert(VotingInstance.endProposalsRegistering({from: owner}), "Registering proposals havent started yet");
         });

         it("should revert startVoting while WfS is at VotesTallied", async () => {
            await expectRevert(VotingInstance.startVotingSession({from: owner}), "Registering proposals phase is not finished");
         });

         it("should revert endVoting while WfS is at VotesTallied", async () => {
            await expectRevert(VotingInstance.endVotingSession({from: owner}), "Voting session havent started yet");
         });



    });

    // ::::::::::::: REGISTRATION ::::::::::::: // 

    describe("tests des requires et des reverts pour l'enregistrement des voters", function () {

        beforeEach(async function () {
            VotingInstance = await Voting.new({from:owner});
        });

        it("should revert, msg.sender not registered", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await expectRevert(VotingInstance.getVoter(owner, {from: voter1}), "You're not a voter");
        });

        it("should revert, voter already registered", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await expectRevert(VotingInstance.addVoter(owner, {from: owner}), "Already registered");
        });

        it("should revert when adding a voter, WfS +1", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await expectRevert(VotingInstance.addVoter(owner, {from: owner}), "Voters registration is not open yet");
        });

        it("should revert when adding a voter, WfS +2", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await expectRevert(VotingInstance.addVoter(owner, {from: owner}), "Voters registration is not open yet");
        });

        it("should revert when adding a voter, WfS +3", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner});
            await expectRevert(VotingInstance.addVoter(owner, {from: owner}), "Voters registration is not open yet");
        });

        it("should revert when adding a voter, WfS +4", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner});
            await VotingInstance.endVotingSession({from: owner});
            await expectRevert(VotingInstance.addVoter(owner, {from: owner}), "Voters registration is not open yet");
        });

        it("should revert when adding a voter, WfS +5", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner});
            await VotingInstance.endVotingSession({from: owner});
            await VotingInstance.tallyVotes({from: owner});
            await expectRevert(VotingInstance.addVoter(voter1, {from: owner}), "Voters registration is not open yet");
        });

        // ::::::::::::: PROPOSAL ::::::::::::: // 
        
    });

    describe("tests des requires et des reverts pour l'ajout de proposals", function () {

        beforeEach(async function () {
            VotingInstance = await Voting.new({from:owner});
        });

        it("should revert, empty proposal", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await VotingInstance.startProposalsRegistering({from: owner});
            await expectRevert(VotingInstance.addProposal("", {from: owner}), "Vous ne pouvez pas ne rien proposer");
        });

        it("should revert when adding a proposal, WfS -1", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await expectRevert(VotingInstance.addProposal("Raclette le jeudi", {from: owner}), "Proposals are not allowed yet");
        });

        it("should revert when adding a proposal, WfS +1", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await expectRevert(VotingInstance.addProposal("Raclette le jeudi", {from: owner}), "Proposals are not allowed yet");
        });

        it("should revert when adding a proposal, WfS +2", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner});
            await expectRevert(VotingInstance.addProposal("Raclette le jeudi", {from: owner}), "Proposals are not allowed yet");
        });

        it("should revert when adding a proposal, WfS +3", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner});
            await VotingInstance.endVotingSession({from: owner});
            await expectRevert(VotingInstance.addProposal("Raclette le jeudi", {from: owner}), "Proposals are not allowed yet");
        });

        it("should revert when adding a proposal, WfS +4", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.addProposal("Raclette le jeudi", {from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner});
            await VotingInstance.setVote(0, {from: owner});
            await VotingInstance.endVotingSession({from: owner});
            await VotingInstance.tallyVotes({from: owner});
            await expectRevert(VotingInstance.addProposal("Macédoine de légumes", {from: owner}), "Proposals are not allowed yet");
        });

        // ::::::::::::: VOTE ::::::::::::: //

    });

    describe("tests des requires et des reverts pour le vote", function () {

        beforeEach(async function () {
            VotingInstance = await Voting.new({from:owner});
        });

        it("should revert when a voter already voted", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.addProposal("Raclette le jeudi", {from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner});
            await VotingInstance.setVote(0, {from: owner});
            await expectRevert(VotingInstance.setVote(0, {from: owner}), "You have already voted");
        });

        it("should revert when voting for a proposition that doesn't exist", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.addProposal("Raclette le jeudi", {from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner});
            await expectRevert(VotingInstance.setVote(2, {from: owner}), "Proposal not found");
        });

        it("should revert when voting session is closed, WfS -3", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await expectRevert(VotingInstance.setVote(0, {from: owner}), "Voting session havent started yet");
        });

        it("should revert when voting session is closed, WfS -2", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await VotingInstance.startProposalsRegistering({from: owner});
            await expectRevert(VotingInstance.setVote(0, {from: owner}), "Voting session havent started yet");
        });

        it("should revert when voting session is closed, WfS -1", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await expectRevert(VotingInstance.setVote(0, {from: owner}), "Voting session havent started yet");
        });

        it("should revert when voting session is closed, WfS +1", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.addProposal("Raclette le jeudi", {from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner});
            await VotingInstance.endVotingSession({from: owner});
            await expectRevert(VotingInstance.setVote(0, {from: owner}), "Voting session havent started yet");
        });

        it("should revert when voting session is closed, WfS +2", async () => {
            await VotingInstance.addVoter(owner, {from: owner});
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.addProposal("Raclette le jeudi", {from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner});
            await VotingInstance.setVote(0, {from: owner});
            await VotingInstance.endVotingSession({from: owner});
            await VotingInstance.tallyVotes({from: owner});
            await expectRevert(VotingInstance.setVote(0, {from: owner}), "Voting session havent started yet");
        });

        // ::::::::::::: TALLY ::::::::::::: //

    });

    describe("tests des requires et des reverts, pour le tally", function () {

        beforeEach(async function () {
            VotingInstance = await Voting.new({from:owner});
        });

        it("should revert until voting session is closed, WfS -4", async () => {
           await expectRevert(VotingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");
        });

        it("should revert until voting session is closed, WfS -3", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await expectRevert(VotingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");

        });

        it("should revert until voting session is closed, WfS -2", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await expectRevert(VotingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");
        });

        it("should revert until voting session is closed, WfS -1", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner});
            await expectRevert(VotingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");
        });
        it("should revert after tallying, WfS +1", async () => {
            await VotingInstance.startProposalsRegistering({from: owner});
            await VotingInstance.endProposalsRegistering({from: owner});
            await VotingInstance.startVotingSession({from: owner});
            await VotingInstance.endVotingSession({from: owner});
            await VotingInstance.tallyVotes({from: owner});
            await expectRevert(VotingInstance.tallyVotes({from: owner}), "Current status is not voting session ended");
        });
    });
})