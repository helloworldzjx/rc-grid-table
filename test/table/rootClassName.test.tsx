import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import ConfigProvider from '../../src/configProvider';
import Table from '../../src/table';

describe('table rootClassName', () => {
  it('applies rootClassName to the wrapper element', () => {
    const html = renderToStaticMarkup(
      <Table
        rootClassName="custom-root"
        className="custom-table"
        columns={[]}
        dataSource={[]}
      />,
    );

    expect(html).toMatch(/^<div[^>]*class="[^"]*custom-root/);
    expect(html.match(/custom-root/g)).toHaveLength(1);
    expect(html).not.toMatch(/^<div[^>]*class="[^"]*custom-table/);
  });

  it('merges rootClassName from ConfigProvider', () => {
    const html = renderToStaticMarkup(
      <ConfigProvider gridTable={{ rootClassName: 'global-root' }}>
        <Table rootClassName="local-root" columns={[]} dataSource={[]} />
      </ConfigProvider>,
    );

    expect(html).toMatch(/^<div[^>]*class="[^"]*global-root/);
    expect(html).toMatch(/^<div[^>]*class="[^"]*local-root/);
  });
});
