import pytest

import csv

from brownie import *
from accounts import *
from helpers import *
from simulation_helpers import *


class Contracts:
    pass


def setAddresses(contracts):
    contracts.sortedTroves.setParams(
        MAX_BYTES_32,
        contracts.vesselManager.address,
        contracts.borrowerOperations.address,
        {"from": accounts[0]},
    )

    contracts.vesselManager.setAddresses(
        contracts.borrowerOperations.address,
        contracts.activePool.address,
        contracts.defaultPool.address,
        contracts.stabilityPool.address,
        contracts.gasPool.address,
        contracts.collSurplusPool.address,
        contracts.priceFeedTestnet.address,
        contracts.vusdToken.address,
        contracts.sortedTroves.address,
        contracts.GRVTToken.address,
        contracts.GRVTStaking.address,
        {"from": accounts[0]},
    )

    contracts.borrowerOperations.setAddresses(
        contracts.vesselManager.address,
        contracts.activePool.address,
        contracts.defaultPool.address,
        contracts.stabilityPool.address,
        contracts.gasPool.address,
        contracts.collSurplusPool.address,
        contracts.priceFeedTestnet.address,
        contracts.sortedTroves.address,
        contracts.vusdToken.address,
        contracts.GRVTStaking.address,
        {"from": accounts[0]},
    )

    contracts.stabilityPool.setAddresses(
        contracts.borrowerOperations.address,
        contracts.vesselManager.address,
        contracts.activePool.address,
        contracts.vusdToken.address,
        contracts.sortedTroves.address,
        contracts.priceFeedTestnet.address,
        contracts.communityIssuance.address,
        {"from": accounts[0]},
    )

    contracts.activePool.setAddresses(
        contracts.borrowerOperations.address,
        contracts.vesselManager.address,
        contracts.stabilityPool.address,
        contracts.defaultPool.address,
        {"from": accounts[0]},
    )

    contracts.defaultPool.setAddresses(
        contracts.vesselManager.address,
        contracts.activePool.address,
        {"from": accounts[0]},
    )

    contracts.collSurplusPool.setAddresses(
        contracts.borrowerOperations.address,
        contracts.vesselManager.address,
        contracts.activePool.address,
        {"from": accounts[0]},
    )

    contracts.hintHelpers.setAddresses(
        contracts.sortedTroves.address,
        contracts.vesselManager.address,
        {"from": accounts[0]},
    )

    # GRVT
    contracts.GRVTStaking.setAddresses(
        contracts.GRVTToken.address,
        contracts.vusdToken.address,
        contracts.vesselManager.address,
        contracts.borrowerOperations.address,
        contracts.activePool.address,
        {"from": accounts[0]},
    )

    contracts.communityIssuance.setAddresses(
        contracts.GRVTToken.address,
        contracts.stabilityPool.address,
        {"from": accounts[0]},
    )


@pytest.fixture
def add_accounts():
    if network.show_active() != "development":
        print("Importing accounts...")
        import_accounts(accounts)


@pytest.fixture
def contracts():
    contracts = Contracts()

    contracts.priceFeedTestnet = PriceFeedTestnet.deploy({"from": accounts[0]})
    contracts.sortedTroves = SortedTroves.deploy({"from": accounts[0]})
    contracts.vesselManager = TroveManager.deploy({"from": accounts[0]})
    contracts.activePool = ActivePool.deploy({"from": accounts[0]})
    contracts.stabilityPool = StabilityPool.deploy({"from": accounts[0]})
    contracts.gasPool = GasPool.deploy({"from": accounts[0]})
    contracts.defaultPool = DefaultPool.deploy({"from": accounts[0]})
    contracts.collSurplusPool = CollSurplusPool.deploy({"from": accounts[0]})
    contracts.borrowerOperations = BorrowerOperationsTester.deploy(
        {"from": accounts[0]}
    )
    contracts.hintHelpers = HintHelpers.deploy({"from": accounts[0]})
    contracts.vusdToken = VUSDToken.deploy(
        contracts.vesselManager.address,
        contracts.stabilityPool.address,
        contracts.borrowerOperations.address,
        {"from": accounts[0]},
    )
    # GRVT
    contracts.GRVTStaking = GRVTStaking.deploy({"from": accounts[0]})
    contracts.communityIssuance = CommunityIssuance.deploy({"from": accounts[0]})
    contracts.GRVTToken = GRVTToken.deploy(
        contracts.communityIssuance.address,
        contracts.GRVTStaking.address,
        accounts[0],  # bountyAddress
        accounts[0],  # lpRewardsAddress
        accounts[0],  # multisigAddress
        {"from": accounts[0]},
    )

    setAddresses(contracts)

    return contracts


@pytest.fixture
def print_expectations():
    # ether_price_one_year = price_ether_initial * (1 + drift_ether)**8760
    # print("Expected ether price at the end of the year: $", ether_price_one_year)
    print(
        "Expected GRVT price at the end of first month: $",
        price_GRVT_initial * (1 + drift_GRVT) ** 720,
    )

    print("\n Open vessels")
    print("E(Q_t^e)    = ", collateral_gamma_k * collateral_gamma_theta)
    print("SD(Q_t^e)   = ", collateral_gamma_k ** (0.5) * collateral_gamma_theta)
    print(
        "E(CR^*(i))  = ",
        (target_cr_a + target_cr_b * target_cr_chi_square_df) * 100,
        "%",
    )
    print(
        "SD(CR^*(i)) = ",
        target_cr_b * (2 * target_cr_chi_square_df) ** (1 / 2) * 100,
        "%",
    )
    print(
        "E(tau)      = ",
        rational_inattention_gamma_k * rational_inattention_gamma_theta * 100,
        "%",
    )
    print(
        "SD(tau)     = ",
        rational_inattention_gamma_k ** (0.5) * rational_inattention_gamma_theta * 100,
        "%",
    )
    print("\n")


def _test_test(contracts):
    print(len(accounts))
    contracts.borrowerOperations.openTrove(
        Wei(1e18),
        Wei(2000e18),
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        {"from": accounts[1], "value": Wei("100 ether")},
    )

    # assert False


"""# Simulation Program
**Sequence of events**

> In each period, the following events occur sequentially


* exogenous ether price input
* vessel liquidation
* return of the previous period's stability pool determined (liquidation gain & airdropped GRVT gain)
* vessel closure
* vessel adjustment
* open vessels
* issuance fee
* vessel pool formed
* VUSD supply determined
* VUSD stability pool demand determined
* VUSD liquidity pool demand determined
* VUSD price determined
* redemption & redemption fee
* GRVT pool return determined
"""


def test_run_simulation(add_accounts, contracts, print_expectations):
    VUSD_GAS_COMPENSATION = contracts.vesselManager.VUSD_GAS_COMPENSATION() / 1e18
    MIN_NET_DEBT = contracts.vesselManager.MIN_NET_DEBT() / 1e18

    contracts.priceFeedTestnet.setPrice(
        floatToWei(price_ether[0]), {"from": accounts[0]}
    )
    # whale
    whale_coll = 30000.0
    contracts.borrowerOperations.openTrove(
        MAX_FEE,
        Wei(10e24),
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        {"from": accounts[0], "value": floatToWei(whale_coll)},
    )
    contracts.stabilityPool.provideToSP(
        floatToWei(stability_initial), ZERO_ADDRESS, {"from": accounts[0]}
    )

    active_accounts = []
    inactive_accounts = [*range(1, len(accounts))]

    price_USDV = 1
    price_GRVT_current = price_GRVT_initial

    data = {
        "airdrop_gain": [0] * n_sim,
        "liquidation_gain": [0] * n_sim,
        "issuance_fee": [0] * n_sim,
        "redemption_fee": [0] * n_sim,
    }
    total_USDV_redempted = 0
    total_coll_added = whale_coll
    total_coll_liquidated = 0

    print(f"Accounts: {len(accounts)}")
    print(f"Network: {network.show_active()}")

    logGlobalState(contracts)

    with open("tests/simulation.csv", "w", newline="") as csvfile:
        datawriter = csv.writer(csvfile, delimiter=",")
        datawriter.writerow(
            [
                "iteration",
                "ETH_price",
                "price_USDV",
                "price_GRVT",
                "num_vessels",
                "total_coll",
                "total_debt",
                "TCR",
                "recovery_mode",
                "last_ICR",
                "SP_USDV",
                "SP_ETH",
                "total_coll_added",
                "total_coll_liquidated",
                "total_USDV_redempted",
            ]
        )

        # Simulation Process
        for index in range(1, n_sim):
            print("\n  --> Iteration", index)
            print("  -------------------\n")
            # exogenous ether price input
            price_ether_current = price_ether[index]
            contracts.priceFeedTestnet.setPrice(
                floatToWei(price_ether_current), {"from": accounts[0]}
            )

            # vessel liquidation & return of stability pool
            result_liquidation = liquidate_vessels(
                accounts,
                contracts,
                active_accounts,
                inactive_accounts,
                price_ether_current,
                price_USDV,
                price_GRVT_current,
                data,
                index,
            )
            total_coll_liquidated = total_coll_liquidated + result_liquidation[0]
            return_stability = result_liquidation[1]

            # close vessels
            result_close = close_vessels(
                accounts,
                contracts,
                active_accounts,
                inactive_accounts,
                price_ether_current,
                price_USDV,
                index,
            )

            # adjust vessels
            [coll_added_adjust, issuance_USDV_adjust] = adjust_vessels(
                accounts,
                contracts,
                active_accounts,
                inactive_accounts,
                price_ether_current,
                index,
            )

            # open vessels
            [coll_added_open, issuance_USDV_open] = open_vessels(
                accounts,
                contracts,
                active_accounts,
                inactive_accounts,
                price_ether_current,
                price_USDV,
                index,
            )
            total_coll_added = total_coll_added + coll_added_adjust + coll_added_open
            # active_accounts.sort(key=lambda a : a.get('CR_initial'))

            # Stability Pool
            stability_update(
                accounts, contracts, active_accounts, return_stability, index
            )

            # Calculating Price, Liquidity Pool, and Redemption
            [
                price_USDV,
                redemption_pool,
                redemption_fee,
                issuance_USDV_stabilizer,
            ] = price_stabilizer(
                accounts,
                contracts,
                active_accounts,
                inactive_accounts,
                price_ether_current,
                price_USDV,
                index,
            )
            total_USDV_redempted = total_USDV_redempted + redemption_pool
            print("VUSD price", price_USDV)
            print("GRVT price", price_GRVT_current)

            issuance_fee = price_USDV * (
                issuance_USDV_adjust + issuance_USDV_open + issuance_USDV_stabilizer
            )
            data["issuance_fee"][index] = issuance_fee
            data["redemption_fee"][index] = redemption_fee

            # GRVT Market
            result_GRVT = GRVT_market(index, data)
            price_GRVT_current = result_GRVT[0]
            # annualized_earning = result_GRVT[1]
            # MC_GRVT_current = result_GRVT[2]

            [
                ETH_price,
                num_vessels,
                total_coll,
                total_debt,
                TCR,
                recovery_mode,
                last_ICR,
                SP_USDV,
                SP_ETH,
            ] = logGlobalState(contracts)
            print("Total redempted ", total_USDV_redempted)
            print("Total ETH added ", total_coll_added)
            print("Total ETH liquid", total_coll_liquidated)
            print(f"Ratio ETH liquid {100 * total_coll_liquidated / total_coll_added}%")
            print(" ----------------------\n")

            datawriter.writerow(
                [
                    index,
                    ETH_price,
                    price_USDV,
                    price_GRVT_current,
                    num_vessels,
                    total_coll,
                    total_debt,
                    TCR,
                    recovery_mode,
                    last_ICR,
                    SP_USDV,
                    SP_ETH,
                    total_coll_added,
                    total_coll_liquidated,
                    total_USDV_redempted,
                ]
            )

            assert price_USDV > 0
