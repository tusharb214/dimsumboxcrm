 import { test } from '@playwright/test';

import { LoginPage } from '../pages/LoginPage';
import { AdminPage } from '../pages/AdminPage';
import { ADMIN } from '../utils/credentials';

test.setTimeout(600000);

// test('Approve All Ready Orders', async ({ page }) {
test('Approve All Ready Orders', async ({ page }) => {

  const login = new LoginPage(page);
  const admin = new AdminPage(page);

  await login.login(
    ADMIN.email,
    ADMIN.password
  );

  await admin.openOrders();
  await admin.showReadyOrders();

  let count = 1;

  while (await admin.hasReadyOrder()) {

    console.log(`Approving Ready Order ${count}`);

    await admin.openReadyOrder();

    const address =
      count % 2 === 0
        ? 'Testing 2'
        : 'Testing 1';

    await admin.approveDelivery(
      address
    );

    await admin.backToOrders();

    await admin.refreshOrders();
    await admin.showReadyOrders();

    count++;

  }

  console.log(
    `Approved ${count - 1} Orders`
  );

});