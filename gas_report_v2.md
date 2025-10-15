No files changed, compilation skipped

Ran 20 tests for test/NFTMarket.t.sol:NFTMarketTest
[PASS] testBuyNFT() (gas: 450000)
[PASS] testBuyNFTNotListed() (gas: 34411)
[PASS] testBuyNFTSellerCannotBuyOwn() (gas: 291816)
[PASS] testCancelListing() (gas: 296165)
[PASS] testCancelListingNotListed() (gas: 34375)
[PASS] testCancelListingNotSeller() (gas: 294388)
[PASS] testConstructor() (gas: 28480)
[PASS] testConstructorZeroAddresses() (gas: 452707)
[PASS] testFuzzListPrice(uint256) (runs: 256, μ: 273972, ~: 273941)
[PASS] testGetWhitelistHash() (gas: 11439)
[PASS] testListNFT() (gas: 276501)
[PASS] testListNFTAlreadyListed() (gas: 299006)
[PASS] testListNFTNotApproved() (gas: 172716)
[PASS] testListNFTNotOwner() (gas: 168188)
[PASS] testListNFTZeroPrice() (gas: 160508)
[PASS] testMultipleListingsAndSales() (gas: 640129)
[PASS] testPermitBuy() (gas: 438507)
[PASS] testPermitBuyExpired() (gas: 292202)
[PASS] testPermitBuyInvalidSignature() (gas: 314121)
[PASS] testPermitBuyWrongCaller() (gas: 291702)
Suite result: ok. 20 passed; 0 failed; 0 skipped; finished in 22.15ms (34.99ms CPU time)

╭--------------------------------------------+-----------------+-------+--------+-------+---------╮
| contracts/NFTMarket.sol:NFTMarket Contract |                 |       |        |       |         |
+=================================================================================================+
| Deployment Cost                            | Deployment Size |       |        |       |         |
|--------------------------------------------+-----------------+-------+--------+-------+---------|
| 1346234                                    | 7200            |       |        |       |         |
|--------------------------------------------+-----------------+-------+--------+-------+---------|
|                                            |                 |       |        |       |         |
|--------------------------------------------+-----------------+-------+--------+-------+---------|
| Function Name                              | Min             | Avg   | Median | Max   | # Calls |
|--------------------------------------------+-----------------+-------+--------+-------+---------|
| buyNFT                                     | 23735           | 55220 | 54191  | 88763 | 4       |
|--------------------------------------------+-----------------+-------+--------+-------+---------|
| cancelListing                              | 23755           | 25486 | 25895  | 26810 | 3       |
|--------------------------------------------+-----------------+-------+--------+-------+---------|
| getDomainSeparator                         | 404             | 404   | 404    | 404   | 2       |
|--------------------------------------------+-----------------+-------+--------+-------+---------|
| getListing                                 | 4826            | 4826  | 4826   | 4826  | 260     |
|--------------------------------------------+-----------------+-------+--------+-------+---------|
| getWhitelistHash                           | 1039            | 1039  | 1039   | 1039  | 1       |
|--------------------------------------------+-----------------+-------+--------+-------+---------|
| list                                       | 21666           | 76316 | 76990  | 77158 | 272     |
|--------------------------------------------+-----------------+-------+--------+-------+---------|
| nftContract                                | 259             | 259   | 259    | 259   | 1       |
|--------------------------------------------+-----------------+-------+--------+-------+---------|
| owner                                      | 2352            | 2352  | 2352   | 2352  | 1       |
|--------------------------------------------+-----------------+-------+--------+-------+---------|
| paymentToken                               | 282             | 282   | 282    | 282   | 1       |
|--------------------------------------------+-----------------+-------+--------+-------+---------|
| permitBuy                                  | 22889           | 42473 | 28739  | 89528 | 4       |
╰--------------------------------------------+-----------------+-------+--------+-------+---------╯


Ran 1 test suite in 57.27ms (22.15ms CPU time): 20 tests passed, 0 failed, 0 skipped (20 total tests)
