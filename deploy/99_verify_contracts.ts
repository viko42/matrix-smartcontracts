import { TASK_SOURCIFY } from 'hardhat-deploy';
import { network } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const verify = async (hre: HardhatRuntimeEnvironment) => {
  if (network.name === 'ronin' || network.name === 'saigon') {
    try {
      console.log('Verifying contracts on Sourcify...');
      await hre.run(TASK_SOURCIFY, {
        endpoint: 'https://sourcify.roninchain.com/server/',
      });
      console.log('Verification complete');
    } catch (error) {
      console.error('Error during verification:', error);
    }
  }
};

verify.tags = ['VerifyContracts'];
verify.runAtTheEnd = true;

export default verify;